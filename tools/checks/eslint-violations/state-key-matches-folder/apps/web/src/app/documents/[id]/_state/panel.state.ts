// 사례: 폴더와 다른 key 를 등록한다 — 이 파일의 key 는 state.documents.[id].<이름> 이다.
import { createStore } from "supa-store";
createStore("state.documents.panel", () => ({ open: false }));
