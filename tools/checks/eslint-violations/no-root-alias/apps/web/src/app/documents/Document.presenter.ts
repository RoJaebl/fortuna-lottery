// 표본: 뿌리 별칭 @/ 로 가져온다 — 층 별칭(@app/ 등)을 쓴다. app/ 블록이 no-restricted-imports 를 덮어도 걸려야 한다.
import { documents } from "@/app/documents";

export const value = documents;
