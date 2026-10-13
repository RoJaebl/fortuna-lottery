// 로또 6/45 의 규칙 상수 — 공 색·분포 라벨·등수 문구가 같은 값을 보게 한다 (lotto-colors 와 함께 도메인을 아는 shared/lib)

/** 등수 문구 — 0 은 낙첨, 1~5 는 「N등」 */
export function rankLabel(rank: number): string {
  return rank >= 1 ? `${rank}등` : "낙첨";
}

/** 번호 구간 — 공 색과 구간 분포가 같은 경계를 쓴다 */
export const NUMBER_ZONES: readonly { from: number; to: number; label: string }[] = [
  { from: 1, to: 10, label: "1-10" },
  { from: 11, to: 20, label: "11-20" },
  { from: 21, to: 30, label: "21-30" },
  { from: 31, to: 40, label: "31-40" },
  { from: 41, to: 45, label: "41-45" },
];

/** 번호가 속한 구간의 순번(0~4) — 범위 밖은 양 끝 구간으로 고정한다 */
export function zoneIndexOf(n: number): number {
  const i = NUMBER_ZONES.findIndex((z) => n <= z.to);
  return i === -1 ? NUMBER_ZONES.length - 1 : i;
}

/** 저구간 상한 — 1~22 */
export const LOW_MAX = 22;
