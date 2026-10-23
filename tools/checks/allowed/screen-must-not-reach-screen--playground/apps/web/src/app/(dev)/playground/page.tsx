// 사례: 놀이터 문 페이지가 화면 모듈의 playground.ts 를 부른다 — 화면 모듈끼리 금지의 유일한 예외다.
import { scenarios } from '@app/documents/playground'
export default function Page() { return scenarios }
