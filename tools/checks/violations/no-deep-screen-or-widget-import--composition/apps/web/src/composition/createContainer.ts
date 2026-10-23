// 사례: 조립 루트가 화면 모듈의 action 파일을 직접 짚는다 — 짓는 법은 화면 모듈의 index.ts 로 받는다.
import { documentList } from '@app/documents/_action/documentList.action'
export const c = documentList
