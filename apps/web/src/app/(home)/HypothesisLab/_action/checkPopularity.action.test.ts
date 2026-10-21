import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { StoreProvider } from "@framework/react";
import { createContainer } from "@composition/createContainer";
import { useCheckPopularityAction } from "./checkPopularity.action";

function setup() {
  const container = createContainer("test");
  const wrapper = ({ children }: { children: ReactNode }) => createElement(StoreProvider, { container, children });
  return { http: container.deps.http, wrapper };
}

describe("useCheckPopularityAction", () => {
  it("조합이 null 이면 요청하지 않는다", () => {
    const { http, wrapper } = setup();
    const { result } = renderHook(() => useCheckPopularityAction(null), { wrapper });
    expect(http.sent).toHaveLength(0);
    expect(result.current).toEqual({ result: null, error: null });
  });

  it("A→B→A 로 돌아와도 앞서 넘어간 A 요청의 늦은 응답은 버려지고 마지막 A 요청의 응답이 보인다", async () => {
    const { http, wrapper } = setup();
    const resolvers: Array<(v: unknown) => void> = [];
    // 같은 조합이 보이지 않게 된 사이에 캐시가 놓이므로, A 는 다시 보일 때 새로 요청된다
    http.respond("/api/hypothesis/popularity", () => new Promise((resolve) => resolvers.push(resolve)));

    const A = [1, 2, 3, 4, 5, 6];
    const B = [7, 8, 9, 10, 11, 12];
    const { result, rerender } = renderHook(({ numbers }) => useCheckPopularityAction(numbers), {
      wrapper,
      initialProps: { numbers: A as number[] | null },
    });
    await waitFor(() => expect(resolvers).toHaveLength(1)); // A 첫 요청(낡을 것)
    rerender({ numbers: B });
    await waitFor(() => expect(resolvers).toHaveLength(2)); // B
    rerender({ numbers: A });
    await waitFor(() => expect(resolvers).toHaveLength(3)); // A 두 번째 요청(최신)

    await act(async () => resolvers[0]?.({ patterns: ["birthday"] })); // 낡은 A 응답
    expect(result.current.result).toBeNull();
    await act(async () => resolvers[2]?.({ patterns: ["consecutive"] })); // 최신 A 응답
    expect(result.current.result?.patterns).toEqual(["consecutive"]);
  });
});
