import { createStore } from "@fortuna-lottery/store";
import { createResource } from "@fortuna-lottery/store/query";
import { SimulationResultViewModel } from "../_model/SimulationResult.viewmodel";
import { simulationBacktestRequest, simulationBacktestResponse } from "../_mapper/simulationBacktest.mapper";

/** 백테스트 — 누를 때마다 그 조합으로 새로 계산하므로 조회 없이 바꾸기만 둔다 */
createStore("api.home.SimulationCard.backtest", (set, get, ctx) =>
  createResource(() => ({
    async backtest(numbers: readonly number[]) {
      try {
        return SimulationResultViewModel.from(
          simulationBacktestResponse(
            await ctx("infra.http").client.send("/api/simulation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(simulationBacktestRequest(numbers)),
            }),
          ),
        );
      } catch (e) {
        throw e instanceof Error ? e : new Error("시뮬레이션에 실패했습니다");
      }
    },
  })),
);
