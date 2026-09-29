// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import { StatisticsModel } from "./Statistics.model";

/** 빈도 → 글로우 강도(0~1) 정규화 — 공 색은 바꾸지 않고 주변 강조만 */
export function glowIntensity(count: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return (count - min) / (max - min);
}

/**
 * 표시 모델 — 그 통계 하나만 보고 정해지는 값을 갖는다(model-vocabulary 규칙 4절).
 * 내 조합이나 상위 몇 개 같은 바깥 값이 필요한 것은 표시 조정자(StatisticsPanel.presenter)가 갖는다.
 */
export class StatisticsViewModel extends StatisticsModel {
  /** 번호별 글로우 강도 — index 0 = 번호 1 */
  get glows(): number[] {
    const min = Math.min(...this.frequency);
    const max = Math.max(...this.frequency);
    return this.frequency.map((count) => glowIntensity(count, min, max));
  }

  /** 당첨 확률의 현실 체감 서술 — 고정 분모 기반 사실만 */
  get probabilityFacts(): string[] {
    const totalCombinations = this.totalCombinations;
    const weeks = totalCombinations; // 매주 1게임 구매 가정
    const years = Math.round(weeks / 52.18);
    return [
      `한 게임이 1등일 확률은 1 / ${totalCombinations.toLocaleString()} 입니다.`,
      `매주 1게임씩 산다면, 평균적으로 1등까지 약 ${years.toLocaleString()}년이 걸리는 확률입니다.`,
      `이 확률은 어떤 번호를 고르든 완전히 동일합니다.`,
    ];
  }

  static from(m: StatisticsModel): StatisticsViewModel {
    return Object.assign(new StatisticsViewModel(), m);
  }
}
