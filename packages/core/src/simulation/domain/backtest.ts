import type { Combination } from "../../shared/combination";
import { scoreAgainstDraw } from "../../shared/scoring";
import type { Draw } from "../../lotterietus/domain/draw";

export interface BacktestReadModel {
  totalDraws: number;
  /** index = 등수 (0 = 낙첨, 1~5 = 등수별 횟수) */
  rankCounts: number[];
  /** 당첨(5등 이상) 회차 목록 — 회차 오름차순 */
  wins: { round: number; rank: number; matchedCount: number }[];
}

/**
 * 타임머신 백테스트 — "이 번호를 과거 전 회차에 넣었다면?"
 * 전 회차를 채점해 등수별 횟수를 집계한다 (사실 기반, 미래 예측 아님).
 */
export function backtest(combination: Combination, draws: readonly Draw[]): BacktestReadModel {
  const rankCounts = new Array<number>(6).fill(0);
  const wins: BacktestReadModel["wins"] = [];
  for (const draw of draws) {
    const { rank, matchedCount } = scoreAgainstDraw(combination, draw.numbers, draw.bonus);
    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
    if (rank > 0) wins.push({ round: draw.round, rank, matchedCount });
  }
  return { totalDraws: draws.length, rankCounts, wins };
}
