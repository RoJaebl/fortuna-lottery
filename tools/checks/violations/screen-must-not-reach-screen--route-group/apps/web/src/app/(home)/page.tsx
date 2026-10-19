// 사례: 라우트 그룹 (home) 의 페이지가 다른 화면 모듈을 부른다 — 괄호를 이스케이프하지 못하면 이 규칙이 서지 않는다.
import { settings } from '@app/settings'
export default function Page() { return settings }
