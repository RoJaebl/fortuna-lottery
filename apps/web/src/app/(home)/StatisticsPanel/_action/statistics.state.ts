import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import { StatisticsViewModel } from "../_model/Statistics.viewmodel";
import { statisticsReadResponse } from "../_mapper/statisticsRead.mapper";

/** 과거 회차 통계 — 조회 조건이 없으므로 칸도 하나다 */
createStore("api.home.StatisticsPanel.statistics", (set, get, ctx) =>
  createResource(() => ({
    query: async () => StatisticsViewModel.from(statisticsReadResponse(await ctx("infra.http").client.get("/api/statistics"))),
  })),
);
