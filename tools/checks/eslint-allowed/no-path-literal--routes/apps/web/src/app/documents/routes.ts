// 허용 표본: 라우트 폴더의 routes.ts 는 주소 문자열을 store.route 콜백의 반환값으로만 쓴다 — 어느 선택자에도 걸리지 않는다.
declare const store: { route(key: string, make: (...a: never[]) => string): void };

store.route("route.documents.list", () => "/documents");
store.route("route.documents.detail", (id: string) => `/documents/${id}`);
