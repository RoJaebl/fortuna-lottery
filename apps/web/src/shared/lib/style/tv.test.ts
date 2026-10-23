import { describe, expect, it } from "vitest";
import { tv } from "./tv";

const probe = tv({
  base: "rounded-card text-small p-5",
  variants: { tone: { muted: "text-muted", tight: "rounded-box text-micro" } },
});

describe("tv", () => {
  it("variant 의 색이 base 의 글자 크기 토큰을 지우지 않는다", () => {
    expect(probe({ tone: "muted" })).toBe("rounded-card text-small p-5 text-muted");
  });
  it("variant 의 토큰이 base 의 같은 갈래 토큰을 이긴다", () => {
    expect(probe({ tone: "tight" })).toBe("p-5 rounded-box text-micro");
  });
  it("class 로 넘긴 값이 base 를 이긴다", () => {
    expect(probe({ class: "p-3" })).toBe("rounded-card text-small p-3");
  });
});
