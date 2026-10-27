import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("거짓 값은 지우고 빈 칸을 남기지 않는다", () => {
    expect(cn("p-5", false, undefined, null, "", "font-bold")).toBe("p-5 font-bold");
  });
  it("같은 갈래는 뒤엣것이 이긴다", () => {
    expect(cn("p-5", "p-3")).toBe("p-3");
    expect(cn("bg-panel", "bg-raised")).toBe("bg-raised");
  });
  it("글자 크기 토큰끼리는 뒤엣것이 이긴다", () => {
    expect(cn("text-small", "text-micro")).toBe("text-micro");
    expect(cn("text-display", "text-nano")).toBe("text-nano");
    expect(cn("text-nano", "text-pico")).toBe("text-pico");
  });
  it("글자 크기 토큰과 색은 함께 남는다", () => {
    expect(cn("text-small", "text-muted")).toBe("text-small text-muted");
    expect(cn("text-nano", "font-bold", "text-warn")).toBe("text-nano font-bold text-warn");
    expect(cn("text-pico", "text-muted")).toBe("text-pico text-muted");
  });
  it("모서리 토큰끼리는 뒤엣것이 이긴다", () => {
    expect(cn("rounded-card", "rounded-box")).toBe("rounded-box");
    expect(cn("rounded-full", "rounded-pill")).toBe("rounded-pill");
  });
  it("두께와 색은 함께 남는다", () => {
    expect(cn("border-b-2", "border-text")).toBe("border-b-2 border-text");
    expect(cn("ring-2", "ring-text")).toBe("ring-2 ring-text");
  });
});
