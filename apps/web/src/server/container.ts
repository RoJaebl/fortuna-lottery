// 컴포지션 루트 — 어댑터를 조립해 유스케이스에 포트를 주입하는 유일한 장소.
// app/api(인프라 계층)만 이 파일을 import할 수 있다 (경계 규칙).
import { makeGetLotterietusStatus } from "@fortuna-lottery/core/lotterietus/application";
import {
  createPrismaClient,
  createPrismaDrawDataAdapter,
} from "@fortuna-lottery/core/lotterietus/infrastructure";
import { makeGetStatistics } from "@fortuna-lottery/core/statistics/application";
import { makeBacktestCombination } from "@fortuna-lottery/core/simulation/application";
import {
  makeDeletePick,
  makeListPicks,
  makeSavePick,
} from "@fortuna-lottery/core/picks/application";
import { createInMemoryPickRepository } from "@fortuna-lottery/core/picks/infrastructure";
import { makeCheckResults } from "@fortuna-lottery/core/results/application";

function buildContainer() {
  // draws는 워커가 수집해 Postgres에 넣은 실데이터를 읽는다.
  // picks/identity는 아직 MVP 어댑터 — 후속: SupabasePickRepository / SupabaseIdentityAdapter로 교체
  const drawData = createPrismaDrawDataAdapter(createPrismaClient());
  const pickRepository = createInMemoryPickRepository();

  return {
    // identity 는 apps/api 로 옮겼다. 남은 picks·results 처리기가 옮겨질 때까지 옛 게스트 어댑터의 값을 여기 둔다
    identity: { getCurrentUser: async () => ({ id: "guest", isGuest: true }) },
    getLotterietusStatus: makeGetLotterietusStatus(drawData),
    getStatistics: makeGetStatistics(drawData),
    backtestCombination: makeBacktestCombination(drawData),
    savePick: makeSavePick({ repository: pickRepository }),
    listPicks: makeListPicks(pickRepository),
    deletePick: makeDeletePick(pickRepository),
    checkResults: makeCheckResults(pickRepository, drawData),
  };
}

type Container = ReturnType<typeof buildContainer>;

// dev HMR·라우트 간에 인메모리 저장소가 유지되도록 globalThis에 1회 조립
const globalRef = globalThis as typeof globalThis & { __fortunaLotteryContainer?: Container };
export const container: Container = (globalRef.__fortunaLotteryContainer ??= buildContainer());
