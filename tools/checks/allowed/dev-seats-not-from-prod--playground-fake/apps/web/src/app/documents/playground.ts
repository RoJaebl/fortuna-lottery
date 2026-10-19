// 사례: 화면 모듈의 놀이터 표면이 가짜 서버의 seed 를 쓴다 — 둘 다 개발 전용 자리다.
import { seed } from '@infrastructure/http/fake'
export const scenarios = [seed]
