// 사례: routes.ts 가 라우트 폴더의 routes.ts 대신 index.ts 를 부른다 — 주소 등록 목록은 routes.ts 만 본다.
import { documents } from "@app/documents";
export const routes = documents;
