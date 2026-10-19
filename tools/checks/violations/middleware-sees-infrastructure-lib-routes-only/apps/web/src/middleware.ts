// 사례: 모든 요청 앞에서 도는 코드가 위젯을 부른다 — 그 코드가 서버 쪽 번들에 실린다.
import { list } from '@widgets/list'
export const middleware = list
