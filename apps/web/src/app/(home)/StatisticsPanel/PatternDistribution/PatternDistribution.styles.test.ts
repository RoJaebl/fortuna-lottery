import { describe, expect, it } from "vitest";
import { patternDistribution } from "./PatternDistribution.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BAR = "w-full rounded-t-[3px] transition-[height,background-color] duration-300";
const LABEL = "text-pico tabular-nums";

describe("patternDistribution 서식", () => {
  const s = patternDistribution();

  it("bar 는 내 조합이 놓인 막대만 신호색으로 칠한다", () => {
    expect(set(s.bar({ highlighted: true }))).toEqual(set(`${BAR} bg-warn`));
    expect(set(s.bar({ highlighted: false }))).toEqual(set(`${BAR} bg-accent/60`));
  });

  it("barLabel 은 내 조합이 놓인 막대만 신호색으로 굵게 적는다", () => {
    expect(set(s.barLabel({ highlighted: true }))).toEqual(set(`${LABEL} font-semibold text-warn`));
    expect(set(s.barLabel({ highlighted: false }))).toEqual(set(`${LABEL} text-muted`));
  });
});
