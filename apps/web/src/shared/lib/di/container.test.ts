import { describe, expect, it, vi } from "vitest";
import { Container, token } from "./container";

describe("Container", () => {
  it("처음 꺼낼 때 한 번 짓고 같은 인스턴스를 내준다", () => {
    const c = new Container();
    const t = token<{ n: number }>("X");
    const factory = vi.fn(() => ({ n: 1 }));
    c.register(t, factory);
    const a = c.resolve(t);
    const b = c.resolve(t);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("등록되지 않은 토큰은 이름을 담아 실패한다", () => {
    expect(() => new Container().resolve(token<number>("X"))).toThrow("등록되지 않은 토큰이다: X");
  });
});
