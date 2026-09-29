import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import type { Combination } from "@fortuna-lottery/kernel";
import { scoreAgainstDraw } from "@fortuna-lottery/kernel";
import type { Backtest } from "../domain/model/Backtest.model.js";

/**
 * 타임머신 백테스트 — "이 번호를 과거 전 회차에 넣었다면?"
 * 전 회차를 채점해 등수별 횟수를 집계한다 (사실 기반, 미래 예측 아님).
 */
export function backtest(combination: Combination, draws: readonly Draw[]): Backtest {
  const rankCounts = new Array<number>(6).fill(0);
  const wins: Backtest["wins"][number][] = [];
  for (const draw of draws) {
    const { rank, matchedCount } = scoreAgainstDraw(combination, draw.numbers, draw.bonus);
    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
    if (rank > 0) wins.push({ round: draw.round, rank, matchedCount });
  }
  return { totalDraws: draws.length, rankCounts, wins };
}
