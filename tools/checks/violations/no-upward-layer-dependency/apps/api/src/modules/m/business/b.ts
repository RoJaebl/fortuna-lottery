// 사례: business 가 interface 의 컨트롤러 쪽 파일을 가져왔다 — 의존은 아래 계층으로만 흐른다.
import { i } from '../interface/i'
export const b = i
