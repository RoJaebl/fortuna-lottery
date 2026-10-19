// 표본: 조정자가 컨테이너에서 꺼낸다 — 컨테이너에서 꺼내는 것은 action 의 훅뿐이다.
declare function useResolve(t: unknown): unknown;
declare const LIST: unknown;

export function useDocumentListPresenter() {
  return useResolve(LIST);
}
