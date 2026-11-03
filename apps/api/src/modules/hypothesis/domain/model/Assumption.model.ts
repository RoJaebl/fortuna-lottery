/**
 * 가정 — 합이 sumRange 안, (topK 가 있으면) 출현 상위 K 개 번호 안, (excludePastWinners 면) 과거 1등 조합이 아님.
 * fixed 는 사람이 고른 번호로, 우주 크기에는 쓰지 않고 뽑기에만 쓴다.
 */
export interface Assumption {
  readonly excludePastWinners: boolean;
  readonly topK: number | null;
  readonly sumRange: { readonly min: number; readonly max: number };
  readonly fixed: readonly number[];
}
