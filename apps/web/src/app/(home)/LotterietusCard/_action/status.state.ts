import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import { LotterietusViewModel } from "../_model/Lotterietus.viewmodel";
import { lotterietusReadResponse } from "../_mapper/lotterietusRead.mapper";

/** 최신 회차와 다음 추첨 — 조회 조건이 없으므로 칸도 하나다 */
createStore("api.home.LotterietusCard.status", (set, get, ctx) =>
  createResource(() => ({
    query: async () => LotterietusViewModel.from(lotterietusReadResponse(await ctx("infra.http").client.get("/api/lotterietus"))),
  })),
);
