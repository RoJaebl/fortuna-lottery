// 허용 표본: 옛 엔진의 createStore(areas) 는 @lib/store 에서 온 다른 함수다 — 첫 인자가 문자열이 아니어도 울지 않는다.
import { createStore } from "@lib/store";
const areas = {};
export const store = createStore(areas);
