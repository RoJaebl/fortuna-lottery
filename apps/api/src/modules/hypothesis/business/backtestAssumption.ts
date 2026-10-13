import { generate, mulberry32, scoreAgainstDraw } from "@fortuna-lottery/kernel";
import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { walkRounds } from "./assumption.js";
import { drawAssumed } from "./drawAssumed.js";

export const TICKETS_PER_ROUND = 20;
export const BACKTEST_SEED = 20261013;

export interface RankTally {
  tickets: number;
  rankCounts: number[];
}

const emptyTally = (): RankTally => ({ tickets: 0, rankCounts: [0, 0, 0, 0, 0, 0] });

export function backtestAssumption(
  assumption: Assumption,
  draws: readonly Draw[],
): { assumed: RankTally; random: RankTally } {
  const rng = mulberry32(BACKTEST_SEED);
  const assumed = emptyTally();
  const random = emptyTally();
  walkRounds(assumption, draws, (draw, before) => {
    for (let i = 0; i < TICKETS_PER_ROUND; i++) {
      const a = drawAssumed(rng, assumption, before.pool, before.pastKeys, before.count);
      if (a.ok) {
        assumed.tickets++;
        assumed.rankCounts[scoreAgainstDraw(a.value, draw.numbers, draw.bonus).rank]!++;
      }
    }
    for (let i = 0; i < TICKETS_PER_ROUND; i++) {
      const r = generate(rng);
      if (r.ok) {
        random.tickets++;
        random.rankCounts[scoreAgainstDraw(r.value, draw.numbers, draw.bonus).rank]!++;
      }
    }
  });
  return { assumed, random };
}
