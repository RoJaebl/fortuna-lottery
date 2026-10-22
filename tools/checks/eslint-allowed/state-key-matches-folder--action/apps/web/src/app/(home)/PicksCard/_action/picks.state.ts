// 허용 표본: 뷰 폴더의 _action/ 이 자기 폴더 경로의 자원과 event 를 최상단에서 등록한다 — _action 은 마디에 들지 않는다.
import { createStore } from "@fortuna-lottery/store";
createStore("event.home.PicksCard.changed", () => ({ kind: "saved" as "saved" | "removed" }));
createStore("api.home.PicksCard.picks", () => ({ items: [] as string[] }));
