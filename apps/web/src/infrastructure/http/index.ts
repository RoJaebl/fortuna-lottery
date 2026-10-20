import type { HttpClient } from "./http.port";

export type { HttpClient } from "./http.port";
export { FetchHttpClient } from "./fetchHttpClient";
export { TestHttpClient } from "./testHttpClient";

/** 등록 콜백이 받는 인자에 HTTP 를 더한다 — 화면 쪽은 이 타입을 import 하지 않고 콜백 인자로만 받는다 */
declare module "@lib/store" {
  interface StoreDeps {
    http: HttpClient;
  }
}
