// 사례: 셸이 infrastructure 를 부른다 — infrastructure 를 보는 것은 끝점 갈래(app/api/)다.
import { HTTP_CLIENT } from '@infrastructure/http'
export default function Layout() { return HTTP_CLIENT }
