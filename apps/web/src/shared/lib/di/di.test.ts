import { describe, expect, it, vi } from "vitest";
import { Container } from ".";

describe("Container", () => {
  it("처음 꺼낼 때 한 번 짓고 같은 인스턴스를 내준다", () => {
    const c = new Container();
    const factory = vi.fn(() => ({}));
    c.register("a", factory);
    expect(c.peek("a")).toBeUndefined();
    expect(c.resolve("a")).toBe(c.resolve("a"));
    expect(c.peek("a")).toBe(c.resolve("a"));
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("등록되지 않은 토큰은 그 이름으로 실패한다", () => {
    const c = new Container();
    expect(c.has("b")).toBe(false);
    expect(() => c.resolve("b")).toThrow("등록되지 않은 토큰이다: b");
  });
});
