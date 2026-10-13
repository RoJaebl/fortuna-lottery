import { rankLabel } from "@/shared/lib/lotto-rules";
import { EvaluationModel } from "./Evaluation.model";

/** 표시 모델 — 가정 평가 결과 하나만 보고 정해지는 문구를 갖는다(model-vocabulary 규칙 4절) */
export class EvaluationViewModel extends EvaluationModel {
  /** 가정이 참일 때만 성립하는 확률 — 화면 어디서나 「가정 확률」이라고만 부른다 */
  get assumedProbabilityLabel(): string {
    return this.assumedCombinations > 0 ? `1 / ${this.assumedCombinations.toLocaleString()}` : "남은 조합 없음";
  }

  get realProbabilityLabel(): string {
    return `1 / ${this.totalCombinations.toLocaleString()}`;
  }

  get hitRateLabel(): string {
    const { hits, rounds } = this.hitRate;
    if (rounds === 0) return "센 회차 없음";
    return `${hits.toLocaleString()} / ${rounds.toLocaleString()}회차 (${((hits / rounds) * 100).toFixed(1)}%)`;
  }

  get expectedRateLabel(): string {
    return `무작위라면 ${(this.hitRate.expectedRate * 100).toFixed(1)}%`;
  }

  /** 등수 1~5 마다 가정 쪽과 무작위 쪽 당첨 장수 */
  get backtestRows(): { label: string; assumed: number; random: number }[] {
    return [1, 2, 3, 4, 5].map((rank) => ({
      label: rankLabel(rank),
      assumed: this.backtest.assumed.rankCounts[rank] ?? 0,
      random: this.backtest.random.rankCounts[rank] ?? 0,
    }));
  }

  static from(m: EvaluationModel): EvaluationViewModel {
    return Object.assign(new EvaluationViewModel(), m);
  }
}
