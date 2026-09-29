import { SimulationResultModel } from "./SimulationResult.model";

export const RANK_LABELS = ["낙첨", "1등", "2등", "3등", "4등", "5등"] as const;

/** 표시 모델 — 백테스트 결과 하나만 보고 정해지는 요약을 갖는다(model-vocabulary 규칙 4절) */
export class SimulationResultViewModel extends SimulationResultModel {
  /** 등수별 요약 행 (당첨 있는 등수만) */
  get summarizeRanks(): { rank: number; label: string; count: number }[] {
    return [1, 2, 3, 4, 5]
      .map((rank) => ({ rank, label: RANK_LABELS[rank] as string, count: this.rankCounts[rank] ?? 0 }))
      .filter((r) => r.count > 0);
  }

  /** 정직한 한 줄 요약 */
  get summaryLine(): string {
    const totalWins = this.wins.length;
    if (totalWins === 0) {
      return `전 ${this.totalDraws.toLocaleString()}회차에서 5등 이상 당첨이 없었습니다.`;
    }
    return `전 ${this.totalDraws.toLocaleString()}회차 중 ${totalWins.toLocaleString()}번 당첨되었을 조합입니다 (5등 이상).`;
  }

  static from(m: SimulationResultModel): SimulationResultViewModel {
    return Object.assign(new SimulationResultViewModel(), m);
  }
}
