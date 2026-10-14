import type {
  HypothesisEvaluateRequest,
  HypothesisEvaluateResponse,
} from "@fortuna-lottery/contract/hypothesis";
import { type AssumptionModel, EvaluationModel } from "../model/Evaluation.model";

/** 가정을 요청으로 — topK 가 없으면 키 자체를 싣지 않는다 */
export function hypothesisEvaluateRequest(a: AssumptionModel): HypothesisEvaluateRequest {
  return a.topK === undefined
    ? { excludePastWinners: a.excludePastWinners }
    : { excludePastWinners: a.excludePastWinners, topK: a.topK };
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
  });
}
