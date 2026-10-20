// 허용 표본: 서버 루트 layout 과 middleware 가 조립 루트에서 주소 등록 목록 routes.ts 를 부른다.
import { routes } from "@composition/routes";
export default function Layout() { return routes; }
