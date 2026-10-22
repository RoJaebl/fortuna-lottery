import { createStore } from "@fortuna-lottery/store";
import { FetchHttpClient } from "./fetchHttpClient";
import type { HttpClient } from "./http.port";

/** 정의가 ctx("infra.http").client 로 받는 HTTP — 시험은 overrideStore 로 TestHttpClient 를 꽂는다 */
createStore("infra.http", () => ({ client: new FetchHttpClient() as HttpClient }));
