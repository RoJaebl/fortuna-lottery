import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { bindReact } from ".";

// store 를 import 하지 않는다 — 공급자가 받는 것은 resolve 하나를 가진 모양이다
const { StoreProvider, useStore } = bindReact({});

function setup() {
  const things: Record<string, unknown> = { "thing.list": {} };
  const container = { resolve: (key: string) => things[key] };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider container={container}>{children}</StoreProvider>
  );
  return { container, wrapper };
}

describe("bindReact", () => {
  it("useStore 는 공급자의 컨테이너에서 꺼내고 밖에서는 실패한다", () => {
    const { container, wrapper } = setup();
    const { result } = renderHook(() => useStore("thing.list"), { wrapper });
    expect(result.current).toBe(container.resolve("thing.list"));
    expect(() => renderHook(() => useStore("thing.list"))).toThrow("StoreProvider 밖에서 꺼냈다: thing.list");
  });
});
