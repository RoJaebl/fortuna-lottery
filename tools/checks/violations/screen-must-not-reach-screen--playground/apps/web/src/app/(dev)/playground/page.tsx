// 사례: 놀이터 문 페이지가 화면 모듈의 action 을 부른다 — 놀이터가 보는 것은 playground.ts 뿐이다.
import { documentList } from '@app/documents/_action/documentList.action'
export default function Page() { return documentList }
