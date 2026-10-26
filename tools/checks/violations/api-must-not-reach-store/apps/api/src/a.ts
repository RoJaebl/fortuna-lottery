// 사례: 응용 서버가 공통 상태 라이브러리를 가져왔다 — supa-store 는 화면 앱만 참조한다.
import { createStore } from 'supa-store'
export const a = createStore
