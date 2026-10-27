// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import { NUMBER_ZONES } from "@lib/lotto-rules";
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

/** 잔디밭 열 — 회차 하나와 1~45 칸의 출현 여부 */
export interface GridColumn {
  round: number;
  cells: { n: number; present: boolean; title: string }[];
}

/** 회차 항목 → 지어 둔 열. 통계를 다시 받으면 항목도 새것이라 옛 열은 함께 버려진다 */
const gridColumns = new WeakMap<object, GridColumn>();

/**
 * 표시 모델 — 그 통계 하나만 보고 정해지는 값을 갖는다(model-vocabulary 규칙 4절).
 * 내 조합이나 상위 몇 개 같은 바깥 값이 필요한 것은 표시 조정자(StatisticsPanel.presenter)가 갖는다.
 */
export class StatisticsViewModel extends StatisticsModel {
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

  /** 합계 구간표 — 6개 합계가 낼 수 있는 21~255 를 20 단위로 묶은 회차 수와 회차 대비 비율(소수 첫째 자리) */
  get sumBands(): { label: string; count: number; percent: number }[] {
    const bands = Array.from({ length: 12 }, (_, i) => {
      const from = 21 + i * 20;
      return { from, to: Math.min(from + 19, 255), count: 0 };
    });
    for (const { sum, count } of this.sumDistribution) {
      const band = bands[Math.floor((sum - 21) / 20)];
      if (band) band.count += count;
    }
    return bands.map(({ from, to, count }) => ({
      label: `${from}~${to}`,
      count,
      percent: this.totalDraws > 0 ? Math.round((count / this.totalDraws) * 1000) / 10 : 0,
    }));
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

  /**
   * 잔디밭 열 하나 — 회차 하나의 1~45 칸. 창(바깥 값)으로 자른 회차만 presenter 가 짓는다.
   * 같은 회차 항목에는 같은 열 객체를 돌려준다 — 화면이 열을 memo 로 건너뛰려면 참조가 같아야 한다
   */
  static gridColumn(entry: { round: number; numbers: number[] }): GridColumn {
    const cached = gridColumns.get(entry);
    if (cached) return cached;
    const { round, numbers } = entry;
    const present = new Set(numbers);
    const column = {
      round,
      cells: Array.from({ length: 45 }, (_, i) => {
        const n = i + 1;
        const has = present.has(n);
        return { n, present: has, title: `제${round}회 · ${n}번${has ? " 출현" : ""}` };
      }),
    };
    gridColumns.set(entry, column);
    return column;
  }

  static from(m: StatisticsModel): StatisticsViewModel {
    return Object.assign(new StatisticsViewModel(), m);
  }
}
