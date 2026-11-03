import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import type { AssumptionModel } from "../_model/Evaluation.model";
import { EvaluationViewModel } from "../_model/Evaluation.viewmodel";
import { hypothesisEvaluateRequest, hypothesisEvaluateResponse } from "../_mapper/hypothesisEvaluate.mapper";
import { hypothesisGenerateRequest, hypothesisGenerateResponse } from "../_mapper/hypothesisGenerate.mapper";

/**
 * 가정 평가는 조회다 — 가정(args)마다 칸이 따로 있어 가정이 바뀌면 다시 받고, 앞선 가정의 늦은 응답은 제 칸에만 든다.
 * 나머지 자동 채우기(generate)는 누를 때마다 새로 뽑으므로 바꾸기다
 */
createStore("api.home.HypothesisLab.assumption", (set, get, ctx) => {
  const evaluate = async (assumption: AssumptionModel) =>
    EvaluationViewModel.from(
      hypothesisEvaluateResponse(
        await ctx("infra.http").client.send("/api/hypothesis/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hypothesisEvaluateRequest(assumption)),
        }),
      ),
    );

  /**
   * K 풀은 서버만 안다. 고른 번호를 실은 평가가 실패하면, 고른 번호 없이·구간 전부·제외 끔(늘 받을 수 있고 가볍다)으로
   * 같은 풀을 물어 풀 밖이 된 번호를 버린다 — 고른 번호가 바뀌면 화면의 조회가 버린 뒤의 가정으로 다시 받는다
   */
  const dropOutsidePool = async (assumption: AssumptionModel) => {
    if (assumption.topK === undefined || assumption.fixed.length === 0) return;
    const probe = { ...assumption, sumRange: { min: 21, max: 255 }, excludePastWinners: false, fixed: [] };
    const pool = await evaluate(probe).then((e) => e.pool, () => null);
    if (pool && assumption.fixed.some((n) => !pool.includes(n))) ctx("state.home.HypothesisLab.switches").keepInPool(pool);
  };

  return createResource(() => ({
    async query(assumption: AssumptionModel) {
      try {
        return await evaluate(assumption);
      } catch (e) {
        await dropOutsidePool(assumption);
        throw e instanceof Error ? e : new Error("가정 평가에 실패했습니다");
      }
    },

    /** 뽑은 번호는 presenter 가 공통 상태로 올린다 */
    async generate(assumption: AssumptionModel) {
      try {
        return hypothesisGenerateResponse(
          await ctx("infra.http").client.send("/api/hypothesis/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hypothesisGenerateRequest(assumption)),
          }),
        );
      } catch (e) {
        throw e instanceof Error ? e : new Error("뽑기에 실패했습니다");
      }
    },
  }));
});
