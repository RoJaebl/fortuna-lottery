// 표본: action 의 훅이 infrastructure 토큰을 꺼낸다 — 훅은 자기 유스케이스 토큰 하나만 꺼낸다.
declare function useResolve(t: unknown): unknown;
declare const HTTP_CLIENT: unknown;

export function useDocumentListAction() {
  return useResolve(HTTP_CLIENT);
}
