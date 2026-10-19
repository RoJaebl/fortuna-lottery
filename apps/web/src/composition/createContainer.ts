import { Container } from "@lib/di";
import { DOMAIN_EVENTS, DomainEvents } from "@infrastructure/events";
import { FetchHttpClient, HTTP_CLIENT, TEST_HTTP, TestHttpClient } from "@infrastructure/http";
import {
  BACKTEST_COMBINATION,
  CHECK_POPULARITY,
  CHECK_RESULTS,
  DELETE_PICK,
  EVALUATE_ASSUMPTION,
  GENERATE_ASSUMED,
  GENERATE_COMBINATION,
  LIST_PICKS,
  LOTTERIETUS_STATUS,
  SAVE_PICK,
  STATISTICS,
  createBacktestCombination,
  createCheckResultsCache,
  createDeletePick,
  createEvaluateAssumption,
  createGenerateAssumed,
  createGenerateCombination,
  createListPicksCache,
  createLotterietusStatusCache,
  createPopularityCache,
  createSavePick,
  createStatisticsCache,
} from "@app/(home)";
import { registerPropagation } from "./propagation";

export type Binding = "real" | "test" | "fake";

/** 조립 루트 — 앱이 뜰 때와 시험이 시작할 때 컨테이너를 새로 짓는다 (frontend-app-layers §5.1 세 단계) */
export function createContainer(env: Binding): Container {
  if (env === "fake") {
    throw new Error("fake 환경은 아직 준비되지 않았다 — 손으로 보고 싶은 장면이 생길 때 그 장면에 맞춰 짓는다");
  }
  const c = new Container();

  // 1단계: 환경 바인딩
  c.register(DOMAIN_EVENTS, () => new DomainEvents());
  if (env === "real") {
    c.register(HTTP_CLIENT, () => new FetchHttpClient());
  } else {
    c.register(TEST_HTTP, () => new TestHttpClient());
    c.register(HTTP_CLIENT, (k) => k.resolve(TEST_HTTP));
  }

  // 2단계: 유스케이스 등록 — 짓는 법과 토큰은 각 화면 모듈의 배럴이 내놓는다
  c.register(STATISTICS, (k) => createStatisticsCache(k.resolve(HTTP_CLIENT)));
  c.register(LOTTERIETUS_STATUS, (k) => createLotterietusStatusCache(k.resolve(HTTP_CLIENT)));
  c.register(LIST_PICKS, (k) => createListPicksCache(k.resolve(HTTP_CLIENT)));
  c.register(CHECK_RESULTS, (k) => createCheckResultsCache(k.resolve(HTTP_CLIENT)));
  c.register(CHECK_POPULARITY, (k) => createPopularityCache(k.resolve(HTTP_CLIENT)));
  c.register(SAVE_PICK, (k) => createSavePick(k.resolve(HTTP_CLIENT), k.resolve(DOMAIN_EVENTS)));
  c.register(DELETE_PICK, (k) => createDeletePick(k.resolve(HTTP_CLIENT), k.resolve(DOMAIN_EVENTS)));
  c.register(GENERATE_COMBINATION, (k) => createGenerateCombination(k.resolve(HTTP_CLIENT)));
  c.register(EVALUATE_ASSUMPTION, (k) => createEvaluateAssumption(k.resolve(HTTP_CLIENT)));
  c.register(GENERATE_ASSUMED, (k) => createGenerateAssumed(k.resolve(HTTP_CLIENT)));
  c.register(BACKTEST_COMBINATION, (k) => createBacktestCombination(k.resolve(HTTP_CLIENT)));

  // 3단계: 전파 배선
  registerPropagation(c);
  return c;
}
