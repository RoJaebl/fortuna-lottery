// 사례: 마디를 더한 key 를 등록한다 — 자식 폴더의 key 를 조상 폴더가 등록하지 못한다.
declare const store: { state(key: string, def: unknown): void };
store.state("state.documents.[id].panel", { initial: false, actions: {} });
