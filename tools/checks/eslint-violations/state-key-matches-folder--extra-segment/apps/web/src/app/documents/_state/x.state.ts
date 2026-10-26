// 사례: 마디를 더한 key 를 등록한다 — 자식 폴더의 key 를 조상 폴더가 등록하지 못한다.
import { createStore } from "supa-store";
createStore("state.documents.[id].panel", () => ({ open: false }));
