// 사례: 원형 옆의 시험 파일이 시험 러너를 가져온다 — 시험은 제품 코드가 아니므로 허용한다.
import { expect } from 'vitest'
import { x } from './x'
export const t = () => expect(x)
