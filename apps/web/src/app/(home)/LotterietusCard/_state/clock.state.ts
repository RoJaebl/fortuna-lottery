import { DISPOSE, createStore } from "supa-store";

/** 카운트다운의 1초 시계 — 브라우저에서만 돈다. 서버 렌더는 지은 순간의 시각 하나로 그린다 */
createStore("state.home.LotterietusCard.clock", (set) => {
  const timer = typeof window === "undefined" ? undefined : setInterval(() => set({ now: Date.now() }), 1000);
  return {
    now: Date.now(),
    [DISPOSE]: () => clearInterval(timer),
  };
});
