import { Container } from "@lib/di";
import { DOMAIN_EVENTS, DomainEvents } from "@infrastructure/events";
import { FetchHttpClient, HTTP_CLIENT, TEST_HTTP, TestHttpClient } from "@infrastructure/http";
import { registerPropagation } from "./propagation";

export type Binding = "real" | "test" | "fake";

/** 조립 루트 — 앱이 뜰 때와 시험이 시작할 때 컨테이너를 새로 짓는다 (frontend-app-layers §5.1 세 단계) */
export function createContainer(env: Binding): Container {
  const c = new Container();

  // 1단계: 환경 바인딩
  c.register(DOMAIN_EVENTS, () => new DomainEvents());
  if (env === "real") {
    c.register(HTTP_CLIENT, () => new FetchHttpClient());
  } else if (env === "test") {
    c.register(TEST_HTTP, () => new TestHttpClient());
    c.register(HTTP_CLIENT, (k) => k.resolve(TEST_HTTP));
  } else {
    throw new Error("fake 바인딩은 아직 준비되지 않았다");
  }

  // 2단계: 유스케이스 등록 (Task 3)

  // 3단계: 전파 배선
  registerPropagation(c);
  return c;
}
