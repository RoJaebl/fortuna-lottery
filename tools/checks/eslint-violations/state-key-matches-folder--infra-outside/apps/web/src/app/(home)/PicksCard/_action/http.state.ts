// 사례: 화면 모듈의 정의 파일이 바깥 도구를 등록한다 — infra. key 는 infrastructure/<이름>/ 에서만 등록한다.
import { createStore } from "supa-store";
createStore("infra.http", () => ({ client: null }));
