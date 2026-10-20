import "./screens"; // 등록이 일어나게 한다 — 모든 화면 모듈의 정의가 store 에 쌓인다 (frontend-app-layers §5.5)
import { store, type Container } from "@lib/store";
import { FetchHttpClient, TestHttpClient } from "@infrastructure/http";
import { DomainEvents } from "@infrastructure/events";

export type Binding = "real" | "test" | "fake";

/** 조립 루트 — 시험은 deps.http 의 타입이 TestHttpClient 인 컨테이너를 받는다. 응답을 정하려는 것이다 (frontend-app-layers §5.1) */
export function createContainer(env: "test"): Container<{ http: TestHttpClient; events: DomainEvents }>;
export function createContainer(env: Binding): Container;
export function createContainer(env: Binding): Container {
  if (env === "fake") {
    throw new Error("fake 환경은 아직 준비되지 않았다 — 손으로 보고 싶은 장면이 생길 때 그 장면에 맞춰 짓는다");
  }
  // 환경마다 다른 것은 콜백 인자를 채우는 값뿐이다
  const http = env === "test" ? new TestHttpClient() : new FetchHttpClient();
  return store.container({ http, events: new DomainEvents() }); // events 는 store 의 EventChannel 약속을 진다
}
