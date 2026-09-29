// 조합 생성에 필요한 난수 — [0, 1) 값을 돌려준다. 모양은 커널의 RandomPort 가 갖고, 여기는 주입 토큰만 더한다.
export type { RandomPort } from "@fortuna-lottery/kernel";

export const RNG = Symbol("RNG");
