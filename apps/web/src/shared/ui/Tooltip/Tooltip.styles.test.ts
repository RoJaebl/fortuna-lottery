import { describe, expect, it } from "vitest";
import { tooltipBubble } from "./Tooltip.styles";

describe("tooltip 서식", () => {
  it("말풍선은 기본으로 숨고 마우스·초점에서 보인다", () => {
    const cls = tooltipBubble().split(" ");
    expect(cls).toContain("opacity-0");
    expect(cls).toContain("pointer-events-none");
    expect(cls).toContain("group-hover:opacity-100");
    expect(cls).toContain("group-focus-within:opacity-100");
  });
});
