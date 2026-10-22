// 사례: 클라이언트 경계가 생성 파일 대신 createContainer 를 부른다 — StoreRegistry 가 보는 조립 루트는 store.gen.ts 하나다.
import { createContainer } from "@composition/createContainer";
export const StoreRegistry = createContainer;
