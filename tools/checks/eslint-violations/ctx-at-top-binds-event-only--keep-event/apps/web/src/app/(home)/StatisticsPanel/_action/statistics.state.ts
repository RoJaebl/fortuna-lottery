// 사례: creator 맨 위에서 event 를 꺼내 담아 둔다 — 맨 위에서 event 에 하는 일은 on·exempt 를 바로 거는 것뿐이다.
import { createStore } from "supa-store";

createStore("api.home.StatisticsPanel.statistics", (_set, _get, ctx) => {
  const changed = ctx("event.home.PicksCard.changed");
  return { refresh: () => changed.emit({}) };
});
