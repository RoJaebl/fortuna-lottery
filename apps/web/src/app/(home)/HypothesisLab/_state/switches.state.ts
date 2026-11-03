import { DISPOSE, createStore } from "supa-store";
import { assumptionRequest } from "../_model/Evaluation.model";

/** 고를 수 있는 번호 수 — 여섯째는 자동 채우기가 고른다 */
const MAX_FIXED = 5;

/**
 * 가정 실험실의 입력 — 과거 당첨 조합 제외, 상위 K 제한과 그 K, 과거 비율로 계산할지,
 * 고른 번호(최대 5개), 센 회차의 끝(null 이면 최신), 실험실 재생 바의 배속(통계 탭과 따로 간다).
 *
 * 회차는 둘이다. untilRound 는 재생 바가 곧바로 보이는 값이고, committedUntilRound 는 평가 조회가 보내는 값이다.
 * 재생 중에는 회차가 0.1 초마다 바뀌는데 평가 한 번은 그보다 오래 걸리므로, 평가는 한 번에 하나만 보내고(문)
 * 그것이 끝나면 그 사이 가장 새 회차 하나만 보낸다 — 가운데 회차들은 건너뛴다
 */
createStore("state.home.HypothesisLab.switches", (set, get, ctx) => {
  let inFlight = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** 회차를 문으로 들이고 그 가정의 평가가 끝나기를 기다린다 — 끝나면(실패여도) 문을 열고, 그 사이 회차가 바뀌었으면 가장 새 것을 들인다 */
  const commit = (untilRound: number | null) => {
    set({ committedUntilRound: untilRound });
    inFlight = true;
    const s = get();
    // presenter 와 같은 args 를 지어 같은 칸을 본다
    const args = assumptionRequest({ ...s, range: ctx("state.home.labRange").committed, untilRound });
    // 한 차례 미룬다 — 화면의 조회는 args 가 바뀌면(effect) 받는 중인 요청이 있어도 새로 보내므로, 먼저 보내면 둘이 된다.
    // 미루면 화면이 보낸 요청을 fetch 가 기다리기만 하고, 화면이 없으면(다른 탭) fetch 가 보낸다
    timer = setTimeout(() => {
      void ctx("api.home.HypothesisLab.assumption")
        .fetch(args)
        .catch(() => undefined) // 실패는 그 칸의 error 에 남는다 — 문만 연다
        .finally(() => {
          inFlight = false;
          const { untilRound: newest, committedUntilRound } = get();
          if (newest !== committedUntilRound) commit(newest);
        });
    }, 0);
  };

  return {
    excludePastWinners: false,
    topKEnabled: false,
    topK: 20,
    pastRateMode: true,
    fixed: [] as number[],
    untilRound: null as number | null,
    committedUntilRound: null as number | null,
    playSpeed: 1,
    toggleExcludePastWinners: () => set(({ excludePastWinners }) => ({ excludePastWinners: !excludePastWinners })),
    toggleTopK: () => set(({ topKEnabled }) => ({ topKEnabled: !topKEnabled })),
    changeTopK: (topK: number) => set({ topK }),
    togglePastRateMode: () => set(({ pastRateMode }) => ({ pastRateMode: !pastRateMode })),
    /** 있으면 빼고 없으면 넣는다 — 다섯 개가 찼으면 넣지 않는다 */
    toggleFixed: (n: number) =>
      set(({ fixed }) => {
        if (fixed.includes(n)) return { fixed: fixed.filter((f) => f !== n) };
        return fixed.length < MAX_FIXED ? { fixed: [...fixed, n].sort((a, b) => a - b) } : {};
      }),
    /** 풀 밖의 고른 번호를 버린다 — 풀이 바뀌면(K·회차) 풀 밖 번호는 늘 불가능이다(spec §5.2) */
    keepInPool: (pool: readonly number[]) => set(({ fixed }) => ({ fixed: fixed.filter((n) => pool.includes(n)) })),
    /** 재생 바의 회차는 곧바로 바꾸고, 평가가 진행 중이 아니면 곧바로 들인다 — 진행 중이면 끝난 뒤 가장 새 것만 들인다 */
    changeUntilRound: (untilRound: number | null) => {
      set({ untilRound });
      if (!inFlight) commit(untilRound);
    },
    changePlaySpeed: (playSpeed: number) => set({ playSpeed }),
    [DISPOSE]: () => clearTimeout(timer),
  };
});
