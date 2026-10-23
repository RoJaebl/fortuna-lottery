// 사례: results 모듈이 picks 모듈의 파일을 직접 가져왔다 — 모듈 사이는 포트와 facade 로만 잇는다.
import { y } from '../n/y'
export const x = y
