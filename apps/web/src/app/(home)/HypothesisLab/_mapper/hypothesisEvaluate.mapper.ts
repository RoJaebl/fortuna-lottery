import type {
  HypothesisEvaluateRequest,
  HypothesisEvaluateResponse,
} from "@fortuna-lottery/contract/hypothesis";
import { type AssumptionModel, EvaluationModel } from "../_model/Evaluation.model";

/** 가정을 요청으로 — topK·untilRound 가 없으면 키 자체를 싣지 않고, fixed 는 언제나 싣는다 */
export function hypothesisEvaluateRequest(a: AssumptionModel): HypothesisEvaluateRequest {
  return {
    sumRange: { ...a.sumRange },
    excludePastWinners: a.excludePastWinners,
    ...(a.topK === undefined ? {} : { topK: a.topK }),
    fixed: [...a.fixed],
    ...(a.untilRound === undefined ? {} : { untilRound: a.untilRound }),
  };
}

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) */
export function hypothesisEvaluateResponse(res: HypothesisEvaluateResponse): EvaluationModel {
  const tally = (t: HypothesisEvaluateResponse["backtest"]["assumed"]) => ({
    tickets: t.tickets,
    rankCounts: [...t.rankCounts],
  });
  return Object.assign(new EvaluationModel(), {
    totalCombinations: res.totalCombinations,
    assumedCombinations: res.assumedCombinations,
    pool: [...res.pool],
    hitRate: { ...res.hitRate },
    backtest: { assumed: tally(res.backtest.assumed), random: tally(res.backtest.random) },
    sumRange: { ...res.sumRange },
    sumRangeCombinations: { ...res.sumRangeCombinations },
    theoryRate: res.theoryRate,
    pastRate: res.pastRate,
    expectedHits: res.expectedHits,
    denominators: { ...res.denominators },
    sumCounts: [...res.sumCounts],
    frequentBands: res.frequentBands.map((b) => ({ ...b })),
    maxWindowRate: res.maxWindowRate,
    emptyBands: res.emptyBands.map((b) => ({ ...b })),
    numbers: res.numbers.map((n) => ({ ...n })),
  });
}
