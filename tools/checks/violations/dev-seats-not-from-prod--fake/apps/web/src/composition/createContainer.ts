// 사례: 운영 조립 루트가 가짜 서버를 부른다 — 가짜 서버는 개발 전용 자리다.
import { seed } from '@infrastructure/http/fake'
export const createContainer = () => seed
