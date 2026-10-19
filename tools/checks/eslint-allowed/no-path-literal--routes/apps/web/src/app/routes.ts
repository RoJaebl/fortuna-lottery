// 허용 표본: 주소 목록은 주소 문자열을 함수의 반환값으로 쓴다 — 어느 선택자에도 걸리지 않는다.
export const routes = {
  documents: () => "/documents",
  document: (id: string) => `/documents/${id}`,
};
