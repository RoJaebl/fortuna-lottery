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

/** 상대 길이 합계 축이 실제 양 끝 바깥으로 두는 여백 — 최소 여백과, 회차가 적을 때 더하는 몫(÷√회차수) */
const SUM_AXIS_PAD = 5;
const SUM_AXIS_PAD_SPREAD = 150;
/** 상대 길이 합계 축의 기본 아래 끝 — 실제 합계가 이보다 작을 때만 넘어간다 */
const SUM_AXIS_FLOOR = 40;

/** rough 이상인 가장 작은 1·2·5×10ⁿ (정수, 1 이상) — 눈금 간격이 사람이 읽기 좋은 수가 되게 한다 */
function niceStep(rough: number): number {
  if (rough <= 1) return 1;
  const unit = 10 ** Math.floor(Math.log10(rough));
  return ([1, 2, 5, 10].map((m) => m * unit).find((s) => s >= rough) ?? 10 * unit);
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
    /** 세로축(출현 횟수) 눈금 — 0 부터 최다 건수 안쪽까지, y 는 0~1 비율 */
    yTicks: { count: number; y: number }[];
    /** 가로축(합계) 눈금 — 양 끝 사이의 20 배수, x 는 0~1 비율. 양 끝은 minSum·maxSum 으로 따로 적는다 */
    xTicks: { sum: number; x: number }[];
  } | null {
    const dist = this.sumDistribution;
    if (dist.length === 0) return null;
    const maxCount = Math.max(...dist.map((d) => d.count));
    const step = niceStep(maxCount / 4);
    return {
      minSum: this.minSum,
      maxSum: this.maxSum,
      maxCount,
      points: dist.map(({ sum, count }) => ({ sum, count, x: this.sumRatio(sum), y: count / maxCount })),
      yTicks: Array.from({ length: Math.floor(maxCount / step) + 1 }, (_, i) => ({
        count: i * step,
        y: (i * step) / maxCount,
      })),
      xTicks: Array.from({ length: 13 }, (_, i) => 20 * (i + 1))
        .filter((sum) => sum > this.minSum && sum < this.maxSum)
        .map((sum) => ({ sum, x: this.sumRatio(sum) })),
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

  /**
   * 1회부터 index 번째(0 부터) 회차까지만 센 합계 분포 — 합계 분포와 회차 수만 바뀐다.
   * axis 를 주면 합계 축을 그 범위로 고정하고(절대 길이), 주지 않으면 쌓은 회차의 최소~최대가 축이다(상대 길이)
   */
  sumsUntil(index: number, axis: { min: number; max: number } | null = null): StatisticsViewModel {
    const counts = new Map<number, number>();
    const rounds = this.recentGrid.slice(0, index + 1);
    for (const { numbers } of rounds) {
      const sum = numbers.reduce((a, b) => a + b, 0);
      counts.set(sum, (counts.get(sum) ?? 0) + 1);
    }
    return Object.assign(new StatisticsViewModel(), this, {
      sumDistribution: [...counts].sort(([a], [b]) => a - b).map(([sum, count]) => ({ sum, count })),
      totalDraws: rounds.length,
      sumAxis: axis,
    });
  }

  /**
   * 합계 축을 실제 양 끝에서 여백만큼 넉넉히 잡은 것 — 최소는 여백을 빼고 20 단위로 내리고, 최대는 여백을
   * 더하고 20 단위로 올린다. 축은 기본 40~255 안이다(전 회차 최소 합계가 48 이라 40 아래는 빈 자리다).
   * 실제 합계가 40 아래로 나오면 그때만 21 까지 내린다. 새 최소·최대가 나와도 20 경계를 넘을 때만 축이
   * 바뀌어, 재생 중에 막대가 좌우로 흔들리지 않는다. 분포가 비면 null.
   *
   * 여백은 5 + 150/√회차수 다. 회차가 적으면 양 끝이 아직 크게 튈 수 있어 넓게 두고(첫 회차는 기본 범위 40~255
   * 에서 시작한다), 회차가 쌓일수록 새 극값이 드물어지므로 좁힌다 — 1 회차 155, 10 회차 52, 100 회차 20,
   * 1245 회차 약 9
   */
  get paddedSumAxis(): { min: number; max: number } | null {
    const first = this.sumDistribution[0]?.sum;
    const last = this.sumDistribution[this.sumDistribution.length - 1]?.sum;
    if (first === undefined || last === undefined) return null;
    const pad = SUM_AXIS_PAD + SUM_AXIS_PAD_SPREAD / Math.sqrt(Math.max(1, this.totalDraws));
    return {
      min: Math.max(first < SUM_AXIS_FLOOR ? 21 : SUM_AXIS_FLOOR, Math.floor((first - pad) / 20) * 20),
      max: Math.min(255, Math.ceil((last + pad) / 20) * 20),
    };
  }

  /** sumsUntil 이 고정한 합계 축 — 없으면 자기 분포의 양 끝이다 */
  private sumAxis: { min: number; max: number } | null = null;

  private get minSum(): number {
    return this.sumAxis?.min ?? this.sumDistribution[0]?.sum ?? 21;
  }

  private get maxSum(): number {
    return this.sumAxis?.max ?? this.sumDistribution[this.sumDistribution.length - 1]?.sum ?? 255;
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
