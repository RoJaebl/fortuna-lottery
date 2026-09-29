import { Inject, Injectable, Optional } from "@nestjs/common";
import { DRAW_SOURCE, type DrawSourcePort } from "../domain/port/DrawSourcePort.js";
import { DRAW_WRITER, type DrawWriterPort } from "../domain/port/DrawWriterPort.js";

/**
 * 한 번에 앞서가 볼 폭.
 * 원격 창이 [R-5, R+4]이므로 maxRound + 6을 요청하면 창의 아래쪽 끝이 정확히
 * maxRound + 1이 되어, 한 요청당 신규 10회차를 빈틈없이 가져온다.
 */
const PROBE_AHEAD = 6;

export interface IngestDrawsOptions {
  /** 요청 간 대기 — 원격 차단 방지. 테스트에서 주입한다 */
  sleep?: (ms: number) => Promise<void>;
  requestDelayMs?: number;
  logger?: (message: string) => void;
}

/** 모듈 파일이 로그 출력 자리를 꽂는 토큰 — 없으면 기본값(1초 간격, 로그 없음)으로 돈다 */
export const INGEST_DRAWS_OPTIONS = Symbol("IngestDrawsOptions");

export interface IngestDrawsResult {
  /** 사이클 시작 시점의 최대 회차 */
  startRound: number;
  /** 따라잡은 뒤의 최대 회차 */
  latestRound: number;
  /** 이번 사이클에 저장한 회차 수 */
  ingestedCount: number;
  /** 원격 요청 횟수 */
  requestCount: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 수집 catch-up 사이클 1회 — 백필과 정기 수집이 같은 경로를 탄다.
 *
 * 저장된 최대 회차부터 원격 최신 회차까지 **빈 구간 없이** 따라잡고 종료한다.
 * 원격은 "요청한 회차가 존재하는가"만 빈 배열 여부로 알려주므로, 크게 점프했다가
 * 빈 응답(또는 저장분과 이어지지 않는 창)을 받으면 폭을 절반으로 줄여 경계를 찾는다.
 */
@Injectable()
export class IngestDraws {
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly requestDelayMs: number;
  private readonly logger: (message: string) => void;

  constructor(
    @Inject(DRAW_SOURCE) private readonly source: DrawSourcePort,
    @Inject(DRAW_WRITER) private readonly writer: DrawWriterPort,
    @Optional() @Inject(INGEST_DRAWS_OPTIONS) options: IngestDrawsOptions = {},
  ) {
    this.sleep = options.sleep ?? defaultSleep;
    this.requestDelayMs = options.requestDelayMs ?? 1000;
    this.logger = options.logger ?? (() => {});
  }

  async execute(): Promise<IngestDrawsResult> {
    const startRound = await this.writer.getMaxRound();
    let maxRound = startRound;
    let step = PROBE_AHEAD;
    let ingestedCount = 0;
    let requestCount = 0;

    for (;;) {
      const batch = await this.source.fetchBatch(maxRound + step);
      requestCount += 1;

      const fresh = batch.filter((draw) => draw.round > maxRound).sort((a, b) => a.round - b.round);
      const first = fresh[0];
      const last = fresh[fresh.length - 1];
      const isContiguous =
        first !== undefined &&
        last !== undefined &&
        first.round === maxRound + 1 &&
        last.round - first.round + 1 === fresh.length;

      if (isContiguous) {
        // 저장분과 이어지는 구간만 저장한다 — 창이 앞서가 생긴 구멍을 절대 남기지 않는다
        await this.writer.upsertDraws(fresh);
        ingestedCount += fresh.length;
        maxRound = last.round;
        step = PROBE_AHEAD;
        this.logger(`수집: ${first.round}~${last.round}회차 (${fresh.length}개)`);
      } else if (step > 1) {
        // 너무 앞서갔다 (빈 응답이거나 창이 저장분과 이어지지 않음) — 폭을 줄여 재시도
        step = Math.max(1, Math.floor(step / 2));
      } else {
        if (first !== undefined) {
          this.logger(
            `경고: ${maxRound + 1}회차를 직접 요청했지만 응답이 이어지지 않습니다 (받은 최소 회차 ${first.round}). 이번 사이클을 중단합니다.`,
          );
        }
        break;
      }

      await this.sleep(this.requestDelayMs);
    }

    return { startRound, latestRound: maxRound, ingestedCount, requestCount };
  }
}
