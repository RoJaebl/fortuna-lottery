import { afterEach } from "vitest";
import { resetStores } from "supa-store";
import "@composition/store.gen"; // store 등록 — 생성 파일이 모든 정의 파일을 싣는다

// 공통 상태는 모듈에 하나뿐이다 — 시험마다 처음 값으로 되돌린다
afterEach(() => resetStores());
