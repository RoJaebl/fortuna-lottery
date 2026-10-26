// 허용 표본: creator 맨 위에서는 event 에 on·exempt 를 걸고, 값은 조회·바꾸기 함수 안에서 필요한 순간에 ctx 로 꺼낸다.
import { createStore } from "supa-store";
import { createResource } from "supa-store/query";

createStore("api.home.StatisticsPanel.statistics", (_set, _get, ctx) => {
  ctx("event.home.PicksCard.changed").on(ctx.key, () => undefined);
  ctx("event.home.LotterietusCard.drawn").exempt(ctx.key, "통계는 회차가 바뀌어도 사람이 다시 열 때 받는다");
  return createResource(() => ({
    query: async () => ctx("infra.http").client,
    async refresh() {
      return ctx("infra.http").client;
    },
  }));
});
