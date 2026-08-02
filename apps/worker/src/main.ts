// 워커 컴포지션 루트 — 실어댑터를 조립해 수집 사이클을 반복한다 (인프라 계층)
import { makeIngestDraws } from "@fortuna-lottery/core/lotterietus/application";
import { nextDrawAt } from "@fortuna-lottery/core/lotterietus/domain";
import {
  createDhlotteryDrawSourceAdapter,
  createPrismaClient,
  createPrismaDrawWriterAdapter,
} from "@fortuna-lottery/core/lotterietus/infrastructure";

/** 추첨 시각 이후 원격에 결과가 올라오기까지의 여유 */
const AFTER_DRAW_BUFFER_MS = 10 * 60 * 1000;
/** 사이클이 실패했을 때 재시도 간격 — 다음 추첨(최대 1주)까지 기다리지 않는다 */
const RETRY_DELAY_MS = 5 * 60 * 1000;

const log = (message: string) => console.log(`[worker ${new Date().toISOString()}] ${message}`);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const ingestDraws = makeIngestDraws({
    source: createDhlotteryDrawSourceAdapter(),
    writer: createPrismaDrawWriterAdapter(prisma),
    logger: log,
  });

  const shutdown = () => {
    log("종료 신호를 받았습니다. 연결을 정리합니다.");
    void prisma.$disconnect().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  log("수집 워커를 시작합니다.");

  for (;;) {
    let failed = false;
    try {
      const result = await ingestDraws();
      log(
        `사이클 완료 — ${result.startRound} → ${result.latestRound}회차, ` +
          `${result.ingestedCount}개 저장, 원격 요청 ${result.requestCount}회`,
      );
    } catch (error) {
      failed = true;
      log(`사이클 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    const wakeAt = failed
      ? new Date(Date.now() + RETRY_DELAY_MS)
      : new Date(nextDrawAt(new Date()).getTime() + AFTER_DRAW_BUFFER_MS);
    log(`다음 실행 예정: ${wakeAt.toISOString()}`);
    await sleep(Math.max(0, wakeAt.getTime() - Date.now()));
  }
}

void main();
