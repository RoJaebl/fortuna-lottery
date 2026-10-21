// 허용 표본: 라우트 그룹의 괄호를 뺀 key 를 최상단에서 등록한다.
import { createStore } from "@fortuna-lottery/store";
createStore("state.home.combination", (set) => ({ value: null as number[] | null, clear: () => set({ value: null }) }));
