// 사례: 화면 앱이 apps/api 의 서버 코드를 직접 가져왔다 — 두 앱은 계약 패키지로만 만난다.
import { b } from '../../api/src/b'
export const a = b
