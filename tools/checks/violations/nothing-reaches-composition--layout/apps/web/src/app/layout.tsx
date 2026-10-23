// 사례: 루트 layout 이 생성 파일 대신 createContainer 를 부른다 — layout 이 보는 조립 루트는 store.gen.ts 하나다.
import { createContainer } from "@composition/createContainer";
export default function Layout() { return createContainer; }
