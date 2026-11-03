import { useId, type ReactNode } from "react";
import { tooltipBubble, tooltipRoot, tooltipTrigger } from "./Tooltip.styles";

interface TooltipProps {
  text: string;
  /** 단추 안 — 기본은 ⓘ */
  children?: ReactNode;
}

/** 마우스·초점에서 말풍선을 보인다. 열고 닫는 것은 CSS(group-hover·group-focus-within)뿐이라 상태가 없다 */
export function Tooltip({ text, children = "ⓘ" }: TooltipProps) {
  const id = useId();
  return (
    <span className={tooltipRoot()}>
      <button type="button" aria-label={text} aria-describedby={id} className={tooltipTrigger()}>
        {children}
      </button>
      <span role="tooltip" id={id} className={tooltipBubble()}>
        {text}
      </span>
    </span>
  );
}
