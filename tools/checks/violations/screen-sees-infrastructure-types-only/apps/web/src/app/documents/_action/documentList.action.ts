// 사례: action 이 HTTP 포트를 타입으로 가져온다 — 포트는 store.cache 의 콜백이 받으니 타입으로도 보지 않는다.
import type { HttpClient } from "@infrastructure/http";
export type DocumentListHttp = HttpClient;
