import { createStore } from "@fortuna-lottery/store";
import { createResource } from "@fortuna-lottery/store/query";
import { ResultsDrawViewModel } from "../_model/ResultsDraw.viewmodel";
import { ResultsCheckItemViewModel } from "../_model/ResultsCheckItem.viewmodel";
import { resultsCheckResponse } from "../_mapper/resultsCheck.mapper";

export interface ResultsCheckState {
  draw: ResultsDrawViewModel | null;
  items: ResultsCheckItemViewModel[];
}

/** 당첨 대조 — 화면이 떠도 받지 않고 사람이 「당첨 대조」를 누를 때(refetch) 받는다 */
createStore("api.home.ResultsCard.check", (set, get, ctx) => {
  ctx("event.home.PicksCard.changed").exempt(
    ctx.key,
    "결과는 사람이 「당첨 대조」를 눌러 받는다 — 누르기 전까지 앞선 결과를 그대로 보인다",
  );
  return createResource(
    () => ({
      query: async (): Promise<ResultsCheckState> => {
        const model = resultsCheckResponse(await ctx("infra.http").client.get("/api/results"));
        return {
          draw: model.draw ? ResultsDrawViewModel.from(model.draw) : null,
          items: ResultsCheckItemViewModel.fromMany(model.items),
        };
      },
    }),
    { auto: false },
  );
});
