import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import type { AssumptionModel } from "../_model/Evaluation.model";
import { EvaluationViewModel } from "../_model/Evaluation.viewmodel";
import { hypothesisEvaluateRequest, hypothesisEvaluateResponse } from "../_mapper/hypothesisEvaluate.mapper";
import { hypothesisGenerateRequest, hypothesisGenerateResponse } from "../_mapper/hypothesisGenerate.mapper";

/** 가정 평가와 가정대로 뽑기 — 누를 때마다 새로 계산하므로 조회 없이 바꾸기만 둔다 */
createStore("api.home.HypothesisLab.assumption", (set, get, ctx) =>
  createResource(() => ({
    async evaluate(assumption: AssumptionModel) {
      try {
        return EvaluationViewModel.from(
          hypothesisEvaluateResponse(
            await ctx("infra.http").client.send("/api/hypothesis/evaluate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(hypothesisEvaluateRequest(assumption)),
            }),
          ),
        );
      } catch (e) {
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
  })),
);
