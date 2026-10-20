// 사례: 삭제 action 이 남의 캐시 key 로 전파 규칙을 단다 — 규칙은 낡는 쪽 캐시의 파일에 둔다.
declare const store: {
  invalidates(event: string, cache: string, opts?: unknown): void;
};

store.invalidates("event.documents.removed", "cache.documents.list");

export function useRemoveDocumentAction() {
  return null;
}
