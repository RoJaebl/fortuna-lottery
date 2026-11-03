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
createStore("api.home.HypothesisLab.assumption", (set, get, ctx) =>
  createResource(() => ({
    async query(assumption: AssumptionModel) {
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
