// 사례: 화면 모듈의 시험이 가짜 HTTP 를 infrastructure 에서 직접 가져온다 — 시험은 createContainer("test") 로 받는다.
import { TestHttpClient } from "@infrastructure/http";
export const c = TestHttpClient;
