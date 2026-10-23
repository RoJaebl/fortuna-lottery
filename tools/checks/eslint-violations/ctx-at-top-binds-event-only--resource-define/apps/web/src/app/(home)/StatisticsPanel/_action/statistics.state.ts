// 사례: 자원 정의 함수 맨 위에서 ctx 로 값을 꺼내 둔다 — 정의 함수는 짓는 순간 한 번 돌아 그때의 값에 묶인다.
import { createStore } from "@fortuna-lottery/store";
import { createResource } from "@fortuna-lottery/store/query";

createStore("api.home.StatisticsPanel.statistics", (_set, _get, ctx) =>
  createResource(() => {
    const picks = ctx("api.home.PicksCard.picks").getData();
    return { query: async () => picks };
  }),
);
