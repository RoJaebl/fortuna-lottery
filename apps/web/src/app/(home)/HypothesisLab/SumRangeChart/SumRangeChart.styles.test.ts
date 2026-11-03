import { describe, expect, it } from "vitest";
import { sumRangeChart } from "./SumRangeChart.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));

describe("sumRangeChart 서식", () => {
  const s = sumRangeChart();

  it("많이 든 구간은 옅은 강조색 띠이고 눌러 고를 수 있다", () => {
    expect(set(s.band({ kind: "frequent" }))).toEqual(set("cursor-pointer fill-accent/15 transition-colors hover:fill-accent/25"));
  });

  it("빈 구간은 빗금 띠다", () => {
    expect(set(s.band({ kind: "empty" }))).toEqual(set("fill-[url(#sum-range-hatch)]"));
  });

  it("고른 구간은 테두리 띠이고 끌면 이어서 움직인다", () => {
    expect(set(s.band({ kind: "selected" }))).toEqual(
      set("pointer-events-none fill-accent/5 stroke-accent transition-transform duration-150 ease-out"),
    );
  });
});
