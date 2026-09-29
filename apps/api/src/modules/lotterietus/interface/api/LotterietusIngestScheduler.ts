import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { INGEST_ENABLED, type IngestEnabledPort } from "../../domain/port/IngestEnabledPort.js";
import { LotterietusFacade } from "../facade/LotterietusFacade.js";

/** 추첨 시각 이후 원격에 결과가 올라오기까지의 여유 */
const AFTER_DRAW_BUFFER_MS = 10 * 60 * 1000;
/** 사이클이 실패했을 때 재시도 간격 — 다음 추첨(최대 1주)까지 기다리지 않는다 */
const RETRY_DELAY_MS = 5 * 60 * 1000;

/**
 * 회차 수집 반복 — 옛 apps/worker 의 루프를 옮겼다. 고정 cron 이 아니라 「다음 추첨 + 10분, 실패하면 5분 뒤」로
 * 깨어나므로 @nestjs/schedule 대신 setTimeout 하나를 이어 건다. 종료할 때 대기 타이머를 지워 프로세스가 내려가게 한다.
 */
@Injectable()
export class LotterietusIngestScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger("LotterietusIngest");
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;

  constructor(
    @Inject(LotterietusFacade) private readonly lotterietus: LotterietusFacade,
    @Inject(INGEST_ENABLED) private readonly enabled: IngestEnabledPort,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.enabled) return;
    this.running = true;
    this.logger.log("수집 워커를 시작합니다.");
    void this.cycle(); // 기동을 막지 않는다 — 첫 사이클(백필일 수 있다)은 뒤에서 돈다
  }

  onModuleDestroy(): void {
    if (!this.running) return;
    this.running = false;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.logger.log("종료 신호를 받았습니다. 연결을 정리합니다.");
  }

  private async cycle(): Promise<void> {
    let failed = false;
    try {
      const result = await this.lotterietus.ingest();
      this.logger.log(
        `사이클 완료 — ${result.startRound} → ${result.latestRound}회차, ` +
          `${result.ingestedCount}개 저장, 원격 요청 ${result.requestCount}회`,
      );
    } catch (error) {
      failed = true;
      this.logger.log(`사이클 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!this.running) return; // 사이클 도중에 종료됐다 — 다음 타이머를 걸지 않는다

    const wakeAt = failed
      ? new Date(Date.now() + RETRY_DELAY_MS)
      : new Date(this.lotterietus.nextDrawAt().getTime() + AFTER_DRAW_BUFFER_MS);
    this.logger.log(`다음 실행 예정: ${wakeAt.toISOString()}`);
    this.timer = setTimeout(() => void this.cycle(), Math.max(0, wakeAt.getTime() - Date.now()));
  }
}
