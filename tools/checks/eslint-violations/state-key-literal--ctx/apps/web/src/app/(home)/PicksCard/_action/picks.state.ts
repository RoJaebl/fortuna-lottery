// 사례: ctx 에 key 를 상수로 넘긴다 — 닿는 범위를 판정할 문자열이 없다.
import { createStore } from "supa-store";
const HTTP = "infra.http";
createStore("api.home.PicksCard.picks", (_set, _get, read) => ({
  load: () => read(HTTP).client,
}));
