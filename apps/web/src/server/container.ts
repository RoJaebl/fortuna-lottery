// 컴포지션 루트 — 어댑터를 조립해 유스케이스에 포트를 주입하는 유일한 장소.
// app/api(인프라 계층)만 이 파일을 import할 수 있다 (경계 규칙).
import { makeGetRecentDraws } from "@fortuna-lottery/core/draw/application";
import { createDummyDrawDataAdapter } from "@fortuna-lottery/core/draw/infrastructure";
import { makeGetStatistics } from "@fortuna-lottery/core/statistics/application";
import { makeGenerateCombination } from "@fortuna-lottery/core/generator/application";
import { makeBacktestCombination } from "@fortuna-lottery/core/simulation/application";
import { makeGetCountdown } from "@fortuna-lottery/core/countdown/application";
import {
  makeDeletePick,
  makeListPicks,
  makeSavePick,
} from "@fortuna-lottery/core/picks/application";
import { createInMemoryPickRepository } from "@fortuna-lottery/core/picks/infrastructure";
import { makeCheckResults } from "@fortuna-lottery/core/results/application";
import { createGuestIdentityAdapter } from "@fortuna-lottery/core/identity/infrastructure";

function buildContainer() {
  // MVP 어댑터 — 후속: RealDrawDataAdapter / SupabasePickRepository / SupabaseIdentityAdapter로 교체
  const drawData = createDummyDrawDataAdapter();
  const pickRepository = createInMemoryPickRepository();
  const identity = createGuestIdentityAdapter();

  return {
    identity,
    getRecentDraws: makeGetRecentDraws(drawData),
    getStatistics: makeGetStatistics(drawData),
    generateCombination: makeGenerateCombination(Math.random),
    backtestCombination: makeBacktestCombination(drawData),
    getCountdown: makeGetCountdown(drawData),
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
