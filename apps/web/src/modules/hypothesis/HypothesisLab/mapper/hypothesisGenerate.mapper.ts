import type {
  HypothesisGenerateRequest,
  HypothesisGenerateResponse,
} from "@fortuna-lottery/contract/hypothesis";
import type { AssumptionModel } from "../model/Evaluation.model";
import { hypothesisEvaluateRequest } from "./hypothesisEvaluate.mapper";

/** 뽑기 요청은 평가 요청과 같은 가정 모양이다 */
export function hypothesisGenerateRequest(a: AssumptionModel): HypothesisGenerateRequest {
  return hypothesisEvaluateRequest(a);
}

/** 가정 우주에서 뽑은 조합 — 원본과 배열을 공유하지 않는다 */
export function hypothesisGenerateResponse(res: HypothesisGenerateResponse): number[] {
  return [...res.numbers];
}
