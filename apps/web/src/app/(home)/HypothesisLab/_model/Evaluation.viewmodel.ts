import { rankLabel } from "@lib/lotto-rules";
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

  /** 백테스트 표 제목 — tickets 는 회차 합계이므로 총 장수로 말한다 */
  get backtestCaption(): string {
    const { assumed, random } = this.backtest;
    return `백테스트 — 총 가정 ${assumed.tickets.toLocaleString()}장 · 무작위 ${random.tickets.toLocaleString()}장 (회차마다 20장)`;
  }

  readonly firstPrizeNote = "1등은 이 장수로는 사실상 나오지 않습니다. 위의 세 확률을 보세요.";

  /** 등수 2~5 마다 가정 쪽과 무작위 쪽 당첨 장수 — 1등은 표에 두지 않는다 */
  get backtestRows(): { label: string; assumed: number; random: number }[] {
    return [2, 3, 4, 5].map((rank) => ({
      label: rankLabel(rank),
      assumed: this.backtest.assumed.rankCounts[rank] ?? 0,
      random: this.backtest.random.rankCounts[rank] ?? 0,
    }));
  }

  static from(m: EvaluationModel): EvaluationViewModel {
    return Object.assign(new EvaluationViewModel(), m);
  }
}
