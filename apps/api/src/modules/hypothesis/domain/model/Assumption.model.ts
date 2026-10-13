/** 가정 — 과거 1등 조합을 뺄지, 출현 상위 K 개 번호로 풀을 좁힐지(null 이면 1~45). */
export interface Assumption {
  readonly excludePastWinners: boolean;
  readonly topK: number | null;
}
