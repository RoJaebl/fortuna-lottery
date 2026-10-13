// 사례: 서비스 파일이 node:fs 로 직접 파일을 읽었다 — 드라이버는 어댑터에서만 쓴다.
import { readFileSync } from 'node:fs'
export const s = readFileSync
