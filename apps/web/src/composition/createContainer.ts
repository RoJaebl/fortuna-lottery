import "./screens"; // 등록이 일어나게 한다 — 모든 화면 모듈의 정의가 store 에 쌓인다 (frontend-app-layers §5.5)
import { store, type Built } from "@framework";
import { EventChannel } from "@lib/events";
import { FetchHttpClient, TestHttpClient, type HttpClient } from "@infrastructure/http";

export type Binding = "real" | "test" | "fake";

/** 조립 루트 — 시험은 deps.http 의 타입이 TestHttpClient 인 컨테이너를 받는다. 응답을 정하려는 것이다 (frontend-app-layers §5.1) */
export function createContainer(env: "test"): Built<{ http: TestHttpClient; events: EventChannel }>;
export function createContainer(env: Binding): Built<{ http: HttpClient; events: EventChannel }>;
export function createContainer(env: Binding): Built<{ http: HttpClient; events: EventChannel }> {
  if (env === "fake") {
    throw new Error("fake 환경은 아직 준비되지 않았다 — 손으로 보고 싶은 장면이 생길 때 그 장면에 맞춰 짓는다");
  }
  // 환경마다 다른 것은 콜백 인자를 채우는 값뿐이다
  const http = env === "test" ? new TestHttpClient() : new FetchHttpClient();
  return store.container({ http, events: new EventChannel() }); // events 는 event 영역이 받는다 — 콜백 인자에는 들지 않는다
}
