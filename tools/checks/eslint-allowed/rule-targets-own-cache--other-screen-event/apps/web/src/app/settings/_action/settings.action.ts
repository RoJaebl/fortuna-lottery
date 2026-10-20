// 허용 표본: 다른 화면 모듈의 사건을 key 문자열로만 쓰고, 둘째 인자는 이 파일이 등록한 자기 캐시다.
declare const store: {
  cache(key: string, make: () => unknown): void;
  invalidates(event: string, cache: string, opts?: unknown): void;
};

store.cache("cache.settings.list", () => ({}));
store.invalidates("event.documents.removed", "cache.settings.list");

export function useSettingsAction() {
  return null;
}
