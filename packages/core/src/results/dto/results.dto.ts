import type { DrawResponse } from "../../lotterietus/dto/draw.dto";

export interface ResultItemResponse {
  pickId: string;
  numbers: number[];
  matchedNumbers: number[];
  matchedCount: number;
  bonusMatched: boolean;
  /** 0 = 낙첨, 1~5 = 등수 */
  rank: number;
}

/** 당첨 대조 응답 DTO — 대조 기준 회차 + 픽별 채점 결과 */
export interface ResultsResponse {
  draw: DrawResponse | null;
  items: ResultItemResponse[];
}
