// 사례: 한 화면 모듈이 다른 모듈의 안쪽 파일을 @/ 별칭으로 가져왔다 — 다른 모듈은 배럴로만 본다.
import { x } from '@/modules/b/Deep/x'
export const a = x
