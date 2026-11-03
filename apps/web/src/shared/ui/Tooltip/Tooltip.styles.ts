import { tv } from "../../lib/style/tv";

export const tooltipRoot = tv({ base: "group relative inline-flex align-middle" });

/** icon 은 ⓘ 단추, 아니면 보이는 글에 점선 밑줄을 그어 말풍선이 있다는 것을 알린다 */
export const tooltipTrigger = tv({
  base: "inline-flex items-center transition-colors focus-visible:outline-none",
  variants: {
    icon: {
      true: "h-4 w-4 justify-center rounded-full text-micro text-muted hover:text-text focus-visible:text-text",
      false:
        "cursor-help text-left underline decoration-line decoration-dotted underline-offset-4 hover:decoration-muted focus-visible:decoration-text",
    },
  },
  defaultVariants: { icon: true },
});

/**
 * 옅은 면과 부드러운 그림자 — 투명도·위치만 천천히 바뀐다. pointer-events-none 은 짧은 도움말이라서이고 WCAG 1.4.13 의 hover·dismiss 규칙은 일부러 맞추지 않았다.
 * align 은 말풍선을 단추의 어디에 맞출지다 — 카드 왼쪽 가장자리의 단추는 start, 오른쪽 가장자리는 end 로 두어 말풍선이 잘리지 않게 한다
 */
export const tooltipBubble = tv({
  base: "pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-64 translate-y-1 rounded-box border border-line/70 bg-raised px-3 py-2 text-left text-nano font-normal normal-case tracking-normal text-text opacity-0 shadow-lg transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
  variants: {
    align: {
      center: "left-1/2 -translate-x-1/2",
      start: "left-0",
      end: "right-0",
    },
  },
  defaultVariants: { align: "center" },
});
