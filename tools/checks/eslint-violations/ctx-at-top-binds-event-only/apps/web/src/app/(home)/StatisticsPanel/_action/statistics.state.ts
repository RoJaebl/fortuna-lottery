// 사례: creator 맨 위에서 ctx 로 값을 꺼내 둔다 — 짓는 순간의 값이라 갈아 끼운 HTTP 를 보지 못한다.
import { createStore } from "@fortuna-lottery/store";

createStore("api.home.StatisticsPanel.statistics", (_set, _get, ctx) => {
  const client = ctx("infra.http").client;
  return { load: () => client };
});
