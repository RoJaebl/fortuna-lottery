import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { bindReact } from ".";

// store 를 import 하지 않는다 — 공급자가 받는 것은 resolve 하나를 가진 모양이고, 상태 부품도 모양으로만 받는다
function counter() {
  let value = 1;
  const watchers = new Set<() => void>();
  return {
    initial: 1,
    get: () => value,
    subscribe(fn: () => void) {
      watchers.add(fn);
      return () => watchers.delete(fn);
    },
    actions: {
      add(n: number) {
        value += n;
        watchers.forEach((fn) => fn());
      },
    },
  };
}

const { StoreProvider, useStore, useStoreState } = bindReact({});

function setup() {
  const things: Record<string, unknown> = { "thing.count": counter(), "thing.list": {} };
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

  it("useStoreState 는 [값, 바꾸는 함수들] 을 주고, 선택자의 값이 바뀔 때만 다시 그린다", () => {
    const { wrapper } = setup();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useStoreState("thing.count", (n: number) => n > 2);
      },
      { wrapper },
    );
    const [big, actions] = result.current as [boolean, { add(n: number): void }];
    expect(big).toBe(false);
    act(() => actions.add(1)); // 2 — 고른 값은 그대로다
    expect(renders).toBe(1);
    act(() => actions.add(1)); // 3
    expect(result.current[0]).toBe(true);
    expect(renders).toBe(2);
  });
});
