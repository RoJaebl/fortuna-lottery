// 허용 표본: 화면 모듈의 시험이 @infrastructure/http 에서 TestHttpClient 를 값으로 가져와 HTTP 를 갈아 끼운다.
import { TestHttpClient } from "@infrastructure/http";
export const c = TestHttpClient;
