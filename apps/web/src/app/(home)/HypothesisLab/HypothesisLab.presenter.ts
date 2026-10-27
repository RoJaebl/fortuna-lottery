import { useStore } from "supa-store/react";
import type { AssumptionModel } from "./_model/Evaluation.model";

/** 스위치 셋을 가정 하나로 — K 스위치가 꺼져 있으면 topK 를 싣지 않는다 */
export function assumptionRequest(excludePastWinners: boolean, topKEnabled: boolean, topK: number): AssumptionModel {
  return topKEnabled ? { excludePastWinners, topK } : { excludePastWinners };
}

export function useHypothesisLabPresenter() {
  const { numbers, choose } = useStore("state.home.combination", { pick: ["numbers", "choose"] });
  const switches = useStore("state.home.HypothesisLab.switches");
  const { excludePastWinners, topKEnabled, topK } = switches;
  const { evaluate: evaluation, generate: generation } = useStore("api.home.HypothesisLab.assumption");
  // 조합이 없으면 인자가 없어 받지 않는다
  const popularity = useStore("api.home.HypothesisLab.popularity", { args: numbers ? { numbers } : undefined, pick: ["data", "error"] });

  const assumption = assumptionRequest(excludePastWinners, topKEnabled, topK);

  const generate = async () => {
    const drawn = await generation.mutateAsync(assumption).catch(() => undefined);
    if (drawn) choose(drawn);
  };

  // 가정이 바뀌면 앞선 결과는 다른 가정을 말하므로 비운다 — 진행 중인 평가의 늦은 응답도 버린다
  const clearEvaluation = () => evaluation.reset();

  return {
    excludePastWinners,
    toggleExcludePastWinners: () => {
      switches.toggleExcludePastWinners();
      clearEvaluation();
    },
    topKEnabled,
    toggleTopK: () => {
      switches.toggleTopK();
      clearEvaluation();
    },
    topK,
    changeTopK: (value: string) => {
      switches.changeTopK(Number(value));
      clearEvaluation();
    },
    evaluate: () => void evaluation.mutate(assumption),
    evaluateLabel: evaluation.pending ? "평가 중…" : "가정 평가",
    evaluateDisabled: evaluation.pending,
    evaluation: evaluation.data ?? null,
    generate: () => void generate(),
    generateLabel: generation.pending ? "뽑는 중…" : "가정대로 뽑기",
    generateDisabled: generation.pending,
    error: evaluation.error ?? generation.error,
    numbers,
    popularityMessages: popularity.data?.messages ?? null,
    popularityError: popularity.error,
  };
}
