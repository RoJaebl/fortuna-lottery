import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import type { HypothesisPopularityResponse } from "@fortuna-lottery/contract/hypothesis";
import type { Combination } from "@fortuna-lottery/kernel";
import { combinationKey } from "./assumption.js";

export type PopularityPattern = HypothesisPopularityResponse["patterns"][number];

export function popularityPatterns(combination: Combination, draws: readonly Draw[]): PopularityPattern[] {
  const s = [...combination].sort((a, b) => a - b);
  const out: PopularityPattern[] = [];
  if (s[s.length - 1]! <= 31) out.push("birthday");
  if (s.some((n) => s.includes(n + 1) && s.includes(n + 2))) out.push("consecutive");
  if (s.every((n, i) => i === 0 || n - s[i - 1]! === s[1]! - s[0]!)) out.push("arithmetic");
  const key = combinationKey(s);
  if (draws.some((d) => combinationKey(d.numbers) === key)) out.push("pastWinner");
  return out;
}
