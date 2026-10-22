// 사례: 바깥 도구를 정의 파일이 아닌 곳에서 등록한다 — 등록은 infrastructure/http/ 의 *.state.ts 가 한다.
import { createStore } from "@fortuna-lottery/store";
export class FetchHttpClient {}
createStore("infra.http", () => ({ client: new FetchHttpClient() }));
