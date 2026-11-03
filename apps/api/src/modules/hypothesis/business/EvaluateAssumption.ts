import { Inject, Injectable } from "@nestjs/common";
import type { HypothesisEvaluateRequest } from "@fortuna-lottery/contract/hypothesis";
import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import { drawInSumRange, err, ok, TOTAL_COMBINATIONS, type Result } from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";
import type { Evaluation } from "../domain/model/Evaluation.model.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { assumedCombinations, combinationKey, hitRate } from "./assumption.js";
import { backtestAssumption } from "./backtestAssumption.js";
import { numberBoard, sumBands, sumCounts } from "./sumAnalysis.js";

export const toAssumption = (r: HypothesisEvaluateRequest): Assumption => ({
  excludePastWinners: r.excludePastWinners,
  topK: r.topK ?? null,
  sumRange: r.sumRange,
  fixed: r.fixed,
});

/** 센 회차 — untilRound 가 있으면 그 회차까지. */
export const countedDraws = (draws: readonly Draw[], untilRound: number | undefined): readonly Draw[] =>
  untilRound === undefined ? draws : draws.filter((d) => d.round <= untilRound);

/**
 * 계약이 보지 않는 도메인 검사 — 구간의 순서, 고른 번호 중복, 고른 번호를 품고 구간 안인 조합이 없음(제외 전).
 * 뒤의 둘은 커널 뽑기의 거절 문구를 그대로 쓴다(뽑기에 쓰는 난수는 거절이면 부르지 않는다).
 */
export function checkAssumption(assumption: Assumption, pool: readonly number[]): Result<void> {
  const { sumRange, fixed } = assumption;
  if (sumRange.min > sumRange.max) return err("합계 구간의 최소가 최대보다 큽니다");
  const probe = drawInSumRange(() => 0, pool, fixed, sumRange.min, sumRange.max);
  return probe.ok ? ok(undefined) : err(probe.error);
}

/** 가정 평가 유스케이스 — 지금 가정 우주, 가정 적중률, 백테스트, 합계 구간 분석 */
@Injectable()
export class EvaluateAssumption {
  constructor(@Inject(DRAW_HISTORY) private readonly drawHistory: DrawHistoryPort) {}

  async execute(request: HypothesisEvaluateRequest): Promise<Result<Evaluation>> {
    const assumption = toAssumption(request);
    const draws = countedDraws(await this.drawHistory.findAll(), request.untilRound);
    const { pool, total, excluded, count } = assumedCombinations(assumption, draws);
    const checked = checkAssumption(assumption, pool);
    if (!checked.ok) return checked;

    const hits = hitRate(assumption, draws);
    const pastRate = hits.rounds === 0 ? 0 : hits.hits / hits.rounds;
    const theoryRate = count / TOTAL_COMBINATIONS;
    const counts = sumCounts(draws);
    const width = assumption.sumRange.max - assumption.sumRange.min + 1;
    const pastKeys = new Set(draws.map((d) => combinationKey(d.numbers)));
    return ok({
      totalCombinations: TOTAL_COMBINATIONS,
      assumedCombinations: count,
      pool,
      hitRate: hits,
      backtest: backtestAssumption(assumption, draws),
      sumRange: assumption.sumRange,
      sumRangeCombinations: { total, excluded },
      theoryRate,
      pastRate,
      expectedHits: theoryRate * hits.rounds,
      // 과거 비율로 곱한 당첨 확률 = pastRate × 1/N, 이론 비율로 곱하면 N 이 지워져 언제나 1/전체 조합 수
      denominators: { past: pastRate > 0 && count > 0 ? Math.round(count / pastRate) : null, theory: TOTAL_COMBINATIONS },
      sumCounts: counts,
      ...sumBands(counts, width, draws.length),
      numbers: numberBoard(draws, assumption, pool, pastKeys),
    });
  }
}
