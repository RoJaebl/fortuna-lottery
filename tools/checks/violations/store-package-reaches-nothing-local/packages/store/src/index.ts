// 사례: 공통 상태 라이브러리가 다른 작업 공간 패키지를 가져왔다 — packages/store 는 자기 안만 본다.
import { c } from '../../contract/index'
export const s = c
