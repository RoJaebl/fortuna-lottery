export interface SimulationRequest {
  numbers: number[];
}

/** 백테스트 응답 DTO — 등수별 횟수 + 당첨 회차 목록 (사실 그대로) */
export interface SimulationResponse {
  totalDraws: number;
  /** index = 등수 (0 = 낙첨) */
  rankCounts: number[];
  wins: { round: number; rank: number; matchedCount: number }[];
}
