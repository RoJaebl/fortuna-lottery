// 사례: presenter 가 영역이 꽂히지 않은 엔진 @lib/store 를 직접 가져온다 — 화면 쪽은 @framework 만 본다.
import type { StoreRegistry } from "@lib/store";
export type Registry = StoreRegistry;
