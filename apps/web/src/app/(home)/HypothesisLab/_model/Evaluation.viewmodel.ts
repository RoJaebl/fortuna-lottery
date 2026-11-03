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

  get pastRateLabel(): string {
    const { hits, rounds } = this.hitRate;
    if (rounds === 0) return "센 회차 없음";
    return `${(this.pastRate * 100).toFixed(1)}% · ${rounds.toLocaleString()}회 중 ${hits.toLocaleString()}회`;
  }

  get theoryRateLabel(): string {
    return `${(this.theoryRate * 100).toFixed(1)}%`;
  }

  /** 합계 구간 안 조합 수 — 제외 전 */
  get inRangeLabel(): string {
    return `1 / ${this.sumRangeCombinations.total.toLocaleString()}`;
  }

  get pastProbabilityLabel(): string {
    const { past } = this.denominators;
    return past === null ? "과거에 든 회차 없음" : `1 / ${past.toLocaleString()}`;
  }

  get theoryProbabilityLabel(): string {
    return `1 / ${this.denominators.theory.toLocaleString()}`;
  }

  get excludedLabel(): string {
    return `제외한 과거 1등 ${this.sumRangeCombinations.excluded.toLocaleString()}개`;
  }

  get gapSentence(): string {
    const expected = `기대(약 ${Math.round(this.expectedHits).toLocaleString()}회)`;
    const d = Math.round(this.hitRate.hits - this.expectedHits);
    if (d === 0) return "기대와 같았습니다.";
    return `과거에 ${expected}보다 ${Math.abs(d).toLocaleString()}회 ${d > 0 ? "더 나왔" : "덜 나왔"}습니다. 이 차이는 우연입니다.`;
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
