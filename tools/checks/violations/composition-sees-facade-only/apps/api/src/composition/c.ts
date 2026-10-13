// 사례: 조립 루트가 모듈 안쪽의 business 파일을 직접 가져왔다 — 조립 루트는 facade 만 본다.
import { b } from '../modules/m/business/b'
export const c = b
