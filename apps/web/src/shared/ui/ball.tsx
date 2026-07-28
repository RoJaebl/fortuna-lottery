import { ballColor } from "../lib/lotto-colors";

interface BallProps {
  n: number;
  size?: "sm" | "md" | "lg";
  /** 0~1 — 공 색을 바꾸지 않고 주변 글로우 강도로 표현 (빈도 히트맵) */
  glow?: number;
  /** 흐리게 (미일치 강조용) */
  dimmed?: boolean;
  /** 강조 링 (일치 번호) */
  ring?: boolean;
}

const SIZES = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" };

/** 로또 공 — 색상 규칙 고정, 강조는 글로우/링/명도로만 */
export function Ball({ n, size = "md", glow = 0, dimmed = false, ring = false }: BallProps) {
  const color = ballColor(n);
  const shadow =
    glow > 0
      ? `0 0 ${Math.round(3 + glow * 14)}px ${Math.round(1 + glow * 4)}px ${color.bg}`
      : undefined;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none ${SIZES[size]} ${dimmed ? "opacity-30" : ""} ${ring ? "ring-2 ring-slate-900" : ""}`}
      style={{ backgroundColor: color.bg, color: color.text, boxShadow: shadow }}
      title={`${n}번`}
    >
      {n}
    </span>
  );
}
