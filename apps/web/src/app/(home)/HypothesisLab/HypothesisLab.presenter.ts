// 가정 확률은 언제나 실제 확률 1/8,145,060 · 과거 비율과 함께 보인다 (정직성 원칙).
import { useStore } from "supa-store/react";
import { keepPreviousData } from "supa-store/query";
import { PLAY_SPEEDS, type RoundTimelineProps } from "../RoundTimeline";
import { assumptionRequest, type SumRange } from "./_model/Evaluation.model";

/** 고를 수 있는 번호 수 — 여섯째는 자동 채우기가 고른다 */
const MAX_FIXED = 5;

/** 6개 번호 합계의 축 — 1+2+…+6 ~ 40+41+…+45 */
const SUM_AXIS = { min: 21, max: 255 } as const;

/** 켜고 끄는 스위치 하나 */
export interface LabSwitch {
  checked: boolean;
  onToggle: () => void;
}

/** 차트 위의 띠 하나 — 합계 min~max, 마우스를 올리면 label */
export interface LabBand {
  min: number;
  max: number;
  label: string;
}

/** 1 보기 — 합계별 과거 회차 막대와 띠, 그 위에 고른 구간 */
export interface LabChart {
  /** 합계 21~255 의 축 끝 — 막대·띠·손잡이를 이 축에 놓는다 */
  axis: { min: number; max: number };
  /** 합계마다 막대 하나 — height 는 가장 높은 막대를 1 로 둔 비. 받기 전이면 빈 배열 */
  bars: { sum: number; height: number }[];
  /** 많이 든 구간(옅은 강조색 띠) */
  frequentBands: LabBand[];
  /** 한 번도 나오지 않은 구간(빗금 띠) */
  emptyBands: LabBand[];
  /** 차트 아래 범례 두 줄 — 받기 전이면 null */
  frequentLegend: string | null;
  emptyLegend: string | null;
  /** 고른 구간(테두리 띠) — 입력 칸과 같은 값이라 끌거나 입력하면 곧바로 바뀐다 */
  selected: SumRange;
  /** 끌어 고른 구간을 알린다 — 순서가 엇갈려도 된다(정렬해 받는다) */
  onSelect: (min: number, max: number) => void;
}

/** 2 가정 걸기 — 구간 입력 두 칸과 스위치 셋 */
export interface LabControls {
  min: number;
  max: number;
  /** 입력 칸의 글자를 그대로 넘긴다 — 빈 칸이나 숫자가 아닌 글자는 버린다 */
  changeMin: (value: string) => void;
  changeMax: (value: string) => void;
  excludePastWinners: LabSwitch;
  topK: LabSwitch & { value: number; onChange: (value: string) => void };
  pastRateMode: LabSwitch;
}

/** 결과 두 줄 표의 한 줄 — 「합이 구간에 들 확률 | 구간 안에서 맞힐 확률 | 당첨 확률」 */
export interface LabRateRow {
  title: string;
  sumInRange: string;
  withinRange: string;
  prize: string;
}

/** 번호판의 번호 하나 */
export interface LabBoardNumber {
  n: number;
  /** 합이 구간에 든 과거 회차에서 이 번호가 나온 횟수 */
  countLabel: string;
  /** false 면 이 가정 아래 이 번호를 넣은 조합이 없다 — 흐리게 */
  possible: boolean;
  selected: boolean;
  /** 고르지 않은 번호인데 불가능하거나 다섯 개가 찼으면 누를 수 없다 */
  disabled: boolean;
  onToggle: () => void;
}

/** 3 결과 읽기 */
export interface LabResult {
  rows: { past: LabRateRow; theory: LabRateRow };
  /** 「과거 비율로 계산」이 꺼져 있으면 과거 줄을 흐리게 접는다 */
  pastRowFolded: boolean;
  excludedLabel: string;
  gapSentence: string;
  board: LabBoardNumber[];
  /** 「고른 번호 2 / 5」 */
  fixedLabel: string;
  autoFill: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    /** 현재 조합 — 없으면 null */
    numbers: number[] | null;
    /** 조합 아래 두 줄 — 과거 줄은 「과거 비율로 계산」이 꺼져 있으면 null */
    pastProbabilityLine: string | null;
    realProbabilityLine: string;
  };
  pool: { label: string; numbers: number[] };
  backtest: {
    caption: string;
    rows: { label: string; assumed: string; random: string }[];
    firstPrizeNote: string;
  };
}

export function useHypothesisLabPresenter() {
  const { numbers, choose } = useStore("state.home.combination", { pick: ["numbers", "choose"] });
  const labRange = useStore("state.home.labRange");
  const switches = useStore("state.home.HypothesisLab.switches");
  const { excludePastWinners, topKEnabled, topK, pastRateMode, fixed, untilRound, committedUntilRound, playSpeed } = switches;

  // 평가는 멈춘 뒤의 구간과 store 가 문을 지나게 한 회차(committed)로 받는다 — 입력 칸과 재생 바는 곧바로 바뀌는 값을 보인다
  const assumption = assumptionRequest({
    range: labRange.committed,
    excludePastWinners,
    topKEnabled,
    topK,
    fixed,
    untilRound: committedUntilRound,
  });
  // 가정이 바뀌어 다시 받는 동안 앞선 결과를 잇는다 — 재생 중에 화면이 비었다 찼다 하지 않게
  const evaluation = useStore("api.home.HypothesisLab.assumption", {
    args: assumption,
    placeholderData: keepPreviousData,
    pick: ["data", "status", "error", "isFetching", "generate"],
  });
  const latest = useStore("api.home.HypothesisLab.latestRound", { pick: ["data"] }).data;
  // 조합이 없으면 인자가 없어 받지 않는다
  const popularity = useStore("api.home.HypothesisLab.popularity", { args: numbers ? { numbers } : undefined, pick: ["data", "error"] });
  const { generate } = evaluation;

  const autoFill = async () => {
    const drawn = await generate.mutateAsync(assumption).catch(() => undefined);
    if (drawn) choose(drawn);
  };

  const e = evaluation.data ?? null;
  const toNumber = (value: string) => (value.trim() === "" ? Number.NaN : Number(value));

  const chart: LabChart = {
    axis: SUM_AXIS,
    bars: e?.sumBars ?? [],
    frequentBands: e?.frequentBandItems ?? [],
    emptyBands: e?.emptyBandItems ?? [],
    frequentLegend: e?.frequentLegend ?? null,
    emptyLegend: e?.emptyLegend ?? null,
    selected: { min: labRange.min, max: labRange.max },
    onSelect: labRange.setRange,
  };

  const controls: LabControls = {
    min: labRange.min,
    max: labRange.max,
    changeMin: (value) => labRange.setRange(toNumber(value), labRange.max),
    changeMax: (value) => labRange.setRange(labRange.min, toNumber(value)),
    excludePastWinners: { checked: excludePastWinners, onToggle: switches.toggleExcludePastWinners },
    topK: {
      checked: topKEnabled,
      onToggle: switches.toggleTopK,
      value: topK,
      onChange: (value) => {
        const k = toNumber(value);
        if (Number.isFinite(k)) switches.changeTopK(k);
      },
    },
    pastRateMode: { checked: pastRateMode, onToggle: switches.togglePastRateMode },
  };

  const result: LabResult | null = e && {
    rows: {
      past: {
        title: "과거 비율을 믿는다면",
        sumInRange: e.pastRateLabel,
        withinRange: e.inRangeLabel,
        prize: e.pastProbabilityLabel,
      },
      theory: {
        title: "공정한 추첨이라면(이론)",
        sumInRange: e.theoryRateLabel,
        withinRange: e.inRangeLabel,
        prize: e.theoryProbabilityLabel,
      },
    },
    pastRowFolded: !pastRateMode,
    excludedLabel: e.excludedLabel,
    gapSentence: e.gapSentence,
    board: e.numbers.map(({ n, possible, count }) => {
      const selected = fixed.includes(n);
      return {
        n,
        countLabel: count.toLocaleString(),
        possible,
        selected,
        disabled: !selected && (!possible || fixed.length >= MAX_FIXED),
        onToggle: () => switches.toggleFixed(n),
      };
    }),
    fixedLabel: `고른 번호 ${fixed.length} / ${MAX_FIXED}`,
    autoFill: {
      label: generate.pending ? "채우는 중…" : "나머지 자동 채우기",
      disabled: generate.pending,
      onClick: () => void autoFill(),
      numbers,
      // 이 확률은 가정의 것이다 — 지금 조합이 생성기에서 왔어도 「이 가정에서 뽑은 조합」의 값으로 읽히게 적는다
      pastProbabilityLine: pastRateMode ? `이 가정에서 뽑은 조합은 과거 비율로 가정하면 ${e.pastProbabilityLabel}` : null,
      realProbabilityLine: `실제 당첨 확률 ${e.theoryProbabilityLabel}`,
    },
    pool: { label: `풀 · ${e.pool.length}개`, numbers: e.pool },
    backtest: {
      caption: e.backtestCaption,
      rows: e.backtestRows.map(({ label, assumed, random }) => ({
        label,
        assumed: assumed.toLocaleString(),
        random: random.toLocaleString(),
      })),
      firstPrizeNote: e.firstPrizeNote,
    },
  };

  // 재생 바 — 위치 i 는 제 i+1 회. 맨 끝을 고르면 「최신」(null)으로 둔다 — 새 회차가 오면 따라간다
  const timeline: RoundTimelineProps | null =
    latest !== undefined && latest > 1
      ? {
          position: Math.min(untilRound ?? latest, latest) - 1,
          minPosition: 0,
          total: latest,
          roundAt: (index) => index + 1,
          onSeek: (index) => switches.changeUntilRound(index + 1 >= latest ? null : index + 1),
          page: 100,
          label: "실험실이 셀 마지막 회차",
          valueText: `제1회 ~ 제${untilRound ?? latest}회까지`,
          speed: playSpeed,
          speeds: PLAY_SPEEDS,
          onSpeedChange: switches.changePlaySpeed,
        }
      : null;

  return {
    /** 처음 받는 중 — 결과가 아직 없다 */
    loading: e === null && evaluation.status !== "error",
    /** 앞선 결과를 보이며 새 가정을 받는 중 */
    updating: evaluation.isFetching && e !== null,
    error: evaluation.error ?? generate.error,
    timeline,
    chart,
    controls,
    result,
    popularity: { numbers, messages: popularity.data?.messages ?? null, error: popularity.error },
  };
}
