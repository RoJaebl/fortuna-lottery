// 사례: 스케줄러가 business 의 유스케이스를 직접 불렀다 — 모듈 안의 호출은 facade 를 거쳐야 한다.
import { b } from '../../business/b'
export const s = b
