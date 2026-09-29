/** 난수 포트 — [0, 1) 범위 값을 반환한다. 테스트에서는 시드 고정 구현을 주입한다. */
export type RandomPort = () => number;

/** mulberry32 — 시드 기반 결정적 PRNG. 더미 데이터 생성·테스트용. */
export function mulberry32(seed: number): RandomPort {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
