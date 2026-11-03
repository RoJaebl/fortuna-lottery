import { tv } from "@lib/style/tv";

/** 차트 위 띠 — 많이 든 구간은 옅은 강조색, 빈 구간은 빗금, 고른 구간은 테두리 */
export const sumRangeChart = tv({
  slots: { band: "" },
  variants: {
    kind: {
      frequent: { band: "cursor-pointer fill-accent/15 transition-colors hover:fill-accent/25" },
      // 빗금 무늬는 차트의 <defs> 가 sum-range-hatch 로 짓는다
      empty: { band: "fill-[url(#sum-range-hatch)]" },
      selected: { band: "pointer-events-none fill-accent/5 stroke-accent transition-transform duration-150 ease-out" },
    },
  },
});
