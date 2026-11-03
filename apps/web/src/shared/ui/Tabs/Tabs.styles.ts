import { tv } from "../../lib/style/tv";

/** underline = 최상단 내비게이션(가는 밑줄), chip = 패널 내부 서브탭(알약, 모바일은 한 줄 가로 스크롤) */
export const tabs = tv({
  slots: { list: "", item: "transition-colors duration-200" },
  variants: {
    variant: {
      underline: {
        list: "flex gap-5 border-b border-line/80",
        item: "-mb-px border-b-2 pb-2.5 pt-1 text-small tracking-tight",
      },
      chip: {
        list: "flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-gutter:stable] md:flex-wrap md:overflow-x-visible",
        item: "shrink-0 rounded-pill border px-3.5 py-1.5 text-nano font-medium",
      },
    },
    selected: { true: {}, false: {} },
  },
  compoundVariants: [
    { variant: "underline", selected: true, class: { item: "border-text font-semibold text-text" } },
    { variant: "underline", selected: false, class: { item: "border-transparent text-muted hover:text-text" } },
    { variant: "chip", selected: true, class: { item: "border-text bg-text text-bg" } },
    { variant: "chip", selected: false, class: { item: "border-line text-muted hover:border-muted hover:text-text" } },
  ],
  defaultVariants: { variant: "underline", selected: false },
});
