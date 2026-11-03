import { useId, type ReactNode } from "react";
import { tooltipBubble, tooltipRoot, tooltipTrigger } from "./Tooltip.styles";

interface TooltipProps {
  text: string;
  /** 단추 안 — 기본은 ⓘ */
  children?: ReactNode;
  /** 말풍선을 단추의 가운데(기본)·왼끝·오른끝에 맞춘다 — 카드 가장자리에서 잘리지 않게 고른다 */
  align?: "center" | "start" | "end";
}

/** 마우스·초점에서 말풍선을 보인다. 열고 닫는 것은 CSS(group-hover·group-focus-within)뿐이라 상태가 없다 */
export function Tooltip({ text, children, align }: TooltipProps) {
  const id = useId();
  return (
    <span className={tooltipRoot()}>
      {/* 이름은 ⓘ 일 때만 따로 준다 — 글은 설명(aria-describedby)으로만 읽힌다 */}
      <button
        type="button"
        aria-label={children === undefined ? "도움말" : undefined}
        aria-describedby={id}
        className={tooltipTrigger({ icon: children === undefined })}
      >
        {children ?? "ⓘ"}
      </button>
      <span role="tooltip" id={id} className={tooltipBubble({ align })}>
        {text}
      </span>
    </span>
  );
}
