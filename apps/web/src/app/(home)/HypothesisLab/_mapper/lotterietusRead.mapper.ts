import type { LotterietusReadResponse } from "@fortuna-lottery/contract/lotterietus";

/** 실험실 재생 바가 쓰는 것은 최신 회차 번호 하나다 */
export function latestRoundResponse(res: LotterietusReadResponse): number {
  return res.round;
}
