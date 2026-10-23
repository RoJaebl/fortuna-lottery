// 사례: 화면 파일이 계약 패키지의 타입을 상대 경로로 직접 가져왔다 — 계약은 변환기에서만 만진다.
import type { C } from '../../../packages/contract/index'
export type V = C
