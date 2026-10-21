import { useState } from "react";
import { useStoreState } from "@framework/react";
import type { AssumptionModel } from "./_model/Evaluation.model";
import { useCheckPopularityAction } from "./_action/checkPopularity.action";
import { useEvaluateAssumptionAction } from "./_action/evaluateAssumption.action";
import { useGenerateAssumedAction } from "./_action/generateAssumed.action";

/** 스위치 셋을 가정 하나로 — K 스위치가 꺼져 있으면 topK 를 싣지 않는다 */
export function assumptionRequest(excludePastWinners: boolean, topKEnabled: boolean, topK: number): AssumptionModel {
  return topKEnabled ? { excludePastWinners, topK } : { excludePastWinners };
}

export function useHypothesisLabPresenter() {
  const [numbers, combination] = useStoreState("state.home.combination");
  const [excludePastWinners, setExcludePastWinners] = useState(true);
  const [topKEnabled, setTopKEnabled] = useState(true);
  const [topK, setTopK] = useState(20);
  const evaluation = useEvaluateAssumptionAction();
  const generation = useGenerateAssumedAction();
  const popularity = useCheckPopularityAction(numbers);

  const assumption = assumptionRequest(excludePastWinners, topKEnabled, topK);

  const generate = async () => {
    const drawn = await generation.run(assumption);
    if (drawn) combination.choose(drawn);
  };

  return {
    excludePastWinners,
    toggleExcludePastWinners: () => {
      setExcludePastWinners((v) => !v);
      evaluation.clear();
    },
    topKEnabled,
    toggleTopK: () => {
      setTopKEnabled((v) => !v);
      evaluation.clear();
    },
    topK,
    changeTopK: (value: string) => {
      setTopK(Number(value));
      evaluation.clear();
    },
    evaluate: () => void evaluation.run(assumption),
    evaluateLabel: evaluation.pending ? "평가 중…" : "가정 평가",
    evaluateDisabled: evaluation.pending,
    evaluation: evaluation.result,
    generate: () => void generate(),
    generateLabel: generation.pending ? "뽑는 중…" : "가정대로 뽑기",
    generateDisabled: generation.pending,
    error: evaluation.error ?? generation.error,
    numbers,
    popularityMessages: popularity.result?.messages ?? null,
    popularityError: popularity.error,
  };
}
