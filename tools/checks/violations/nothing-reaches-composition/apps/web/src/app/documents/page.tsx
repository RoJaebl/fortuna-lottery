// 사례: 화면 모듈이 조립 루트를 부른다 — 조립은 위에서 내려오고 화면은 훅으로 받는다.
import { createContainer } from '@composition/createContainer'
export default function Page() { return createContainer }
