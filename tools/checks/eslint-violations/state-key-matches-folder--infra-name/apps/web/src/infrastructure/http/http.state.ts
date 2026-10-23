// 사례: infrastructure/http/ 가 폴더 이름과 다른 key 를 등록한다 — 이 파일의 key 는 infra.http 다.
import { createStore } from "@fortuna-lottery/store";
createStore("infra.client", () => ({ client: null }));
