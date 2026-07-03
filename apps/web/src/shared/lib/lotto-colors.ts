// 실제 로또 공 색상 규칙 (설계 문서: 공 색은 바꾸지 않는다)
// 1–10 노랑 · 11–20 파랑 · 21–30 빨강 · 31–40 회색 · 41–45 초록

export interface BallColor {
  bg: string;
  text: string;
}

const COLORS: BallColor[] = [
  { bg: "#fbc400", text: "#3d2e00" }, // 노랑
  { bg: "#69c8f2", text: "#06344a" }, // 파랑
  { bg: "#ff7272", text: "#4a0606" }, // 빨강
  { bg: "#aaaaaa", text: "#2b2b2b" }, // 회색
  { bg: "#b0d840", text: "#2a3a05" }, // 초록
];

/** 번호(1~45) → 공 색상 (순수 함수) */
export function ballColor(n: number): BallColor {
  const zone = Math.min(4, Math.max(0, Math.floor((n - 1) / 10)));
  return COLORS[zone] as BallColor;
}
