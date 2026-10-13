// 사례: 한 화면 모듈이 다른 모듈의 안쪽 파일을 상대 경로로 가져왔다 — 다른 모듈은 배럴로만 본다.
import { x } from '../b/internal/x'
export const a = x
