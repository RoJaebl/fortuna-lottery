// 사례: 화면 모듈의 시험이 infrastructure 의 안쪽 파일을 짚는다 — 시험이 보는 것은 @infrastructure/http 의 공개 표면 하나다.
import { FetchHttpClient } from "@infrastructure/http/fetchHttpClient";
export const c = FetchHttpClient;
