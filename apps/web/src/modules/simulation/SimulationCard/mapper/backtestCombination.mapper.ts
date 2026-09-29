import type {
  SimulationBacktestRequest,
  SimulationBacktestResponse,
} from "@fortuna-lottery/contract/simulation";
import { SimulationResultModel } from "../../model/SimulationResult.model";

/** 고른 번호를 요청으로 — 원본과 배열을 공유하지 않는다 */
export function backtestCombinationRequest(numbers: readonly number[]): SimulationBacktestRequest {
  return { numbers: [...numbers] };
}

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 받는 값이 unknown 이라 여기서 한 번 좁힌다 */
export function backtestCombinationResponse(res: unknown): SimulationResultModel {
  const dto = res as SimulationBacktestResponse;
  return Object.assign(new SimulationResultModel(), {
    totalDraws: dto.totalDraws,
    rankCounts: [...dto.rankCounts],
    wins: dto.wins.map((w) => ({ ...w })),
  });
}
