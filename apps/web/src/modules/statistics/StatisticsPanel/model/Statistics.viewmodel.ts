// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import { NUMBER_ZONES } from "@/shared/lib/lotto-rules";
import { StatisticsModel } from "./Statistics.model";

/** 분포 막대 하나 — 홀짝·고저·구간 분포가 함께 쓴다 */
export interface DistBar {
  label: string;
  count: number;
  /** 전체 대비 반올림 비율(%) */
  percent: number;
  /** 6px 바닥 + 최다 대비 56px */
  heightPx: number;
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
    return this.frequency.map((count) => StatisticsViewModel.glowIntensity(count, min, max));
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

  /** 번호별 출현 막대 — 최다 대비 높이(%)와 전체 뽑힘(회차×6) 대비 비율 */
  get frequencyBars(): { number: number; count: number; heightPercent: number; sharePercent: string }[] {
    const max = Math.max(...this.frequency, 1);
    const totalPicks = this.totalDraws * 6;
    return this.frequency.map((count, i) => ({
      number: i + 1,
      count,
      heightPercent: (count / max) * 100,
      sharePercent: totalPicks > 0 ? ((count / totalPicks) * 100).toFixed(2) : "0",
    }));
  }

  /** 합계 분포 차트 — x·y 는 0~1 비율이고 화면이 자기 크기로 늘린다. 분포가 비면 null */
  get sumChart(): {
    minSum: number;
    maxSum: number;
    maxCount: number;
    points: { sum: number; count: number; x: number; y: number }[];
  } | null {
    const dist = this.sumDistribution;
    if (dist.length === 0) return null;
    const maxCount = Math.max(...dist.map((d) => d.count));
    return {
      minSum: this.minSum,
      maxSum: this.maxSum,
      maxCount,
      points: dist.map(({ sum, count }) => ({ sum, count, x: this.sumRatio(sum), y: count / maxCount })),
    };
  }

  /** 합계 하나가 합계 축의 어디(0~1)에 놓이는가 — 내 합계 표지도 같은 축을 쓴다 */
  sumRatio(sum: number): number {
    return (sum - this.minSum) / Math.max(1, this.maxSum - this.minSum);
  }

  private get minSum(): number {
    return this.sumDistribution[0]?.sum ?? 21;
  }

  private get maxSum(): number {
    return this.sumDistribution[this.sumDistribution.length - 1]?.sum ?? 255;
  }

  /** 동시 출현 페어 막대 — 1위 대비 너비(%) */
  get topPairBars(): { pair: [number, number]; count: number; widthPercent: number }[] {
    const maxCount = this.topPairs[0]?.count ?? 1;
    return this.topPairs.map(({ a, b, count }) => ({ pair: [a, b], count, widthPercent: (count / maxCount) * 100 }));
  }

  /** 잔디밭이 덮는 회차 범위 문구 — 회차가 없으면 빈 문자열 */
  get recentRange(): string {
    const rounds = this.recentGrid;
    const first = rounds[0]?.round;
    const last = rounds[rounds.length - 1]?.round;
    return first && last ? `제${first}회 ~ 제${last}회 (최근 ${rounds.length}회차)` : "";
  }

  /** 잔디밭 열 — 회차마다 1~45 칸과 그 칸의 출현 여부 */
  get recentColumns(): { round: number; cells: { n: number; present: boolean; title: string }[] }[] {
    return this.recentGrid.map(({ round, numbers }) => {
      const present = new Set(numbers);
      return {
        round,
        cells: Array.from({ length: 45 }, (_, i) => {
          const n = i + 1;
          const has = present.has(n);
          return { n, present: has, title: `제${round}회 · ${n}번${has ? " 출현" : ""}` };
        }),
      };
    });
  }

  /** 홀수 개수(0~6) 분포 막대 — 회차 대비 */
  get oddBars(): DistBar[] {
    return StatisticsViewModel.distBars(this.oddCountDist, this.totalDraws, (i) => `홀${i}`);
  }

  /** 저구간(1~22) 개수(0~6) 분포 막대 — 회차 대비 */
  get lowBars(): DistBar[] {
    return StatisticsViewModel.distBars(this.lowCountDist, this.totalDraws, (i) => `저${i}`);
  }

  /** 구간별 총 출현 막대 — 구간 합계 대비 */
  get zoneBars(): DistBar[] {
    const total = this.zoneCounts.reduce((a, b) => a + b, 0);
    return StatisticsViewModel.distBars(this.zoneCounts, total, (i) => NUMBER_ZONES[i]?.label ?? "");
  }

  private static distBars(dist: number[], total: number, labelOf: (i: number) => string): DistBar[] {
    const max = Math.max(...dist, 1);
    return dist.map((count, i) => ({
      label: labelOf(i),
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      heightPx: 6 + (count / max) * 56,
    }));
  }

  /** 빈도 → 글로우 강도(0~1) 정규화 — 공 색은 바꾸지 않고 주변 강조만 */
  static glowIntensity(count: number, min: number, max: number): number {
    if (max <= min) return 0.5;
    return (count - min) / (max - min);
  }

  static from(m: StatisticsModel): StatisticsViewModel {
    return Object.assign(new StatisticsViewModel(), m);
  }
}
