import { describe, expect, it } from "vitest";
import { patternDistribution } from "./PatternDistribution.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));

describe("patternDistribution 서식", () => {
  const s = patternDistribution();

  it("bar 는 highlighted 참·거짓 모두 지금 화면의 클래스를 낸다", () => {
    expect(set(s.bar({ highlighted: true }))).toEqual(set("w-full rounded-t bg-warn"));
    expect(set(s.bar({ highlighted: false }))).toEqual(set("w-full rounded-t bg-accent/70"));
  });

  it("barLabel 은 highlighted 참·거짓 모두 지금 화면의 클래스를 낸다", () => {
    expect(set(s.barLabel({ highlighted: true }))).toEqual(set("text-nano font-bold text-warn"));
    expect(set(s.barLabel({ highlighted: false }))).toEqual(set("text-nano text-muted"));
  });
});
