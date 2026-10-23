import { tv } from "../lib/style/tv";

/** underline = 최상단 내비게이션(밑줄), chip = 패널 내부 서브탭(칩, 모바일은 한 줄 가로 스크롤) */
export const tabs = tv({
  slots: { list: "", item: "transition-colors" },
  variants: {
    variant: {
      underline: {
        list: "flex gap-1 border-b border-line",
        item: "-mb-px border-b-2 px-3 py-2 text-small font-medium",
      },
      chip: {
        list: "flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-gutter:stable] md:flex-wrap md:overflow-x-visible",
        item: "shrink-0 rounded-box px-3 py-2 text-micro font-semibold",
      },
    },
    selected: { true: {}, false: {} },
  },
  compoundVariants: [
    { variant: "underline", selected: true, class: { item: "border-text text-text" } },
    { variant: "underline", selected: false, class: { item: "border-transparent text-muted hover:text-text" } },
    { variant: "chip", selected: true, class: { item: "bg-text text-bg" } },
    { variant: "chip", selected: false, class: { item: "bg-said text-muted hover:bg-inset" } },
  ],
  defaultVariants: { variant: "underline", selected: false },
});
