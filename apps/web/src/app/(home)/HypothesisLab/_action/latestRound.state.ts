import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import { latestRoundResponse } from "../_mapper/lotterietusRead.mapper";

/** 최신 회차 — 실험실 재생 바의 끝이다. 상단 띠의 자원은 형제 폴더라 꺼낼 수 없어 따로 받는다 */
createStore("api.home.HypothesisLab.latestRound", (set, get, ctx) =>
  createResource(() => ({
    query: async () => latestRoundResponse(await ctx("infra.http").client.get("/api/lotterietus")),
  })),
);
