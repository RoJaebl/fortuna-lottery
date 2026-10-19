import { token } from "@lib/di";
import type { HttpClient } from "./http.port";
import type { TestHttpClient } from "./testHttpClient";

export type { HttpClient } from "./http.port";
export { FetchHttpClient } from "./fetchHttpClient";
export { TestHttpClient } from "./testHttpClient";

export const HTTP_CLIENT = token<HttpClient>("HTTP_CLIENT");
/** test 환경에서만 등록된다 — 시험이 응답을 정하려고 꺼낸다 */
export const TEST_HTTP = token<TestHttpClient>("TEST_HTTP");
