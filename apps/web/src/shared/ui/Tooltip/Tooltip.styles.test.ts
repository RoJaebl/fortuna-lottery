import { describe, expect, it } from "vitest";
import { tooltipBubble, tooltipTrigger } from "./Tooltip.styles";

describe("tooltip 단추 서식", () => {
  it("ⓘ 단추는 작은 원이고, 글을 감싼 단추는 크기를 묶지 않고 점선 밑줄을 긋는다", () => {
    expect(tooltipTrigger().split(" ")).toContain("w-4");
    const text = tooltipTrigger({ icon: false }).split(" ");
    expect(text).not.toContain("w-4");
    expect(text).toContain("decoration-dotted");
  });
});

describe("tooltip 서식", () => {
  it("말풍선은 기본으로 숨고 마우스·초점에서 보인다", () => {
    const cls = tooltipBubble().split(" ");
    expect(cls).toContain("opacity-0");
    expect(cls).toContain("pointer-events-none");
    expect(cls).toContain("group-hover:opacity-100");
    expect(cls).toContain("group-focus-within:opacity-100");
  });

  it("가운데가 기본이고, 카드 가장자리에서는 단추의 왼끝·오른끝에 맞춘다", () => {
    expect(tooltipBubble().split(" ")).toContain("-translate-x-1/2");
    const start = tooltipBubble({ align: "start" }).split(" ");
    expect(start).toContain("left-0");
    expect(start).not.toContain("-translate-x-1/2");
    expect(tooltipBubble({ align: "end" }).split(" ")).toContain("right-0");
  });
});
