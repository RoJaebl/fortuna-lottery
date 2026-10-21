// 허용 표본: _state 파일이 @framework 의 store 를 쓰고 declare module 로 등록부에 key 를 덧붙인다 — declare 는 import 가 아니다.
import { store } from "@framework";

declare module "@lib/store" {
  interface StoreRegistry {
    "state.documents.selection": { initial: string[] };
  }
}

export const registered = store;
