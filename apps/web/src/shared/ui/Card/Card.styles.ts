import { tv } from "../../lib/style/tv";

/** 카드 — 흰 종이 위에 옅은 선 하나로 층을 내고, 넉넉한 여백과 작은 머리글로 정돈한다 */
export const card = tv({
  slots: {
    root: "rounded-card border border-line/80 bg-panel p-6",
    header: "mb-5",
    title: "text-small font-semibold tracking-tight text-text",
    subtitle: "mt-1 text-nano leading-relaxed text-muted",
    footnote: "mt-6 flex gap-1.5 border-t border-line/70 pt-3 text-nano leading-relaxed text-muted",
    footnoteMark: "shrink-0 text-warn",
  },
});
