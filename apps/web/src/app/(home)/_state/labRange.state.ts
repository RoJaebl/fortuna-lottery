import { DISPOSE, createStore } from "supa-store";

/** 6개 번호 합계가 낼 수 있는 범위 — 1+2+…+6 ~ 40+41+…+45 */
const SUM_MIN = 21;
const SUM_MAX = 255;
/** 차트 끌기가 멈춘 뒤 보낼 때까지 기다리는 시간 */
const DEBOUNCE_MS = 300;

const clamp = (n: number) => Math.min(SUM_MAX, Math.max(SUM_MIN, Math.round(n)));

/**
 * 실험할 합계 구간 — 통계 탭과 가정 실험실이 함께 쓴다.
 * min·max 는 입력 칸과 차트 손잡이가 보이는 값이라 곧바로 바뀌고,
 * committed 는 평가 조회가 보내는 값이다 — 차트 끌기(setRange)는 멈춘 뒤 300ms 에 따라오고,
 * 입력 칸과 통계 탭의 「이 구간으로 실험하기」(setRangeNow)는 곧바로 따라온다
 */
createStore("state.home.labRange", (set) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** 두 값을 정렬해 21~255 로 묶는다 — 끌기 도중 손잡이가 엇갈려도 min ≤ max 다. 숫자가 아니면 null */
  const place = (a: number, b: number) => {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    const range = { min: clamp(Math.min(a, b)), max: clamp(Math.max(a, b)) };
    set(range);
    clearTimeout(timer);
    return range;
  };
  return {
    min: 121,
    max: 160,
    committed: { min: 121, max: 160 },
    setRange: (a: number, b: number) => {
      const range = place(a, b);
      if (range) timer = setTimeout(() => set({ committed: range }), DEBOUNCE_MS);
    },
    setRangeNow: (a: number, b: number) => {
      const range = place(a, b);
      if (range) set({ committed: range });
    },
    [DISPOSE]: () => clearTimeout(timer),
  };
});
