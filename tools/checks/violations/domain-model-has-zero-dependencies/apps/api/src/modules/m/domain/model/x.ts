// 사례: Pick.model.ts 가 business 의 계산 함수를 가져왔다 — 도메인 원형은 같은 폴더 밖을 참조하지 않는다.
import { y } from '../../business/y'
export const x = y
