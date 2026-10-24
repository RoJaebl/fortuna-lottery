import { ballColor } from "../../lib/lotto-colors";
import { ball } from "./Ball.styles";

interface BallProps {
  n: number;
  size?: "sm" | "md" | "lg";
  /** 0~1 — 공 색을 바꾸지 않고 주변 글로우 강도로 표현 */
  glow?: number;
  /** 흐리게 (미일치 강조용) */
  dimmed?: boolean;
  /** 강조 링 (일치 번호) */
  ring?: boolean;
}

/** 로또 공 — 색상 규칙 고정, 강조는 글로우/링/명도로만 */
export function Ball({ n, size = "md", glow = 0, dimmed = false, ring = false }: BallProps) {
  const color = ballColor(n);
  const shadow =
    glow > 0
      ? `0 0 ${Math.round(3 + glow * 14)}px ${Math.round(1 + glow * 4)}px ${color.bg}`
      : undefined;
  return (
    <span
      className={ball({ size, dimmed, ring })}
      style={{ backgroundColor: color.bg, color: color.text, boxShadow: shadow }}
      title={`${n}번`}
    >
      {n}
    </span>
  );
}
