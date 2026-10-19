import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { ContainerProvider } from "@lib/di";
import { TEST_HTTP } from "@infrastructure/http";
import { createContainer } from "@composition/createContainer";
import { useCheckPopularityAction } from "./checkPopularity.action";

function setup() {
  const container = createContainer("test");
  const wrapper = ({ children }: { children: ReactNode }) => createElement(ContainerProvider, { container, children });
  return { http: container.resolve(TEST_HTTP), wrapper };
}

describe("useCheckPopularityAction", () => {
  it("조합이 null 이면 요청하지 않는다", () => {
    const { http, wrapper } = setup();
    const { result } = renderHook(() => useCheckPopularityAction(null), { wrapper });
    expect(http.sent).toHaveLength(0);
    expect(result.current).toEqual({ result: null, error: null });
  });

  it("조합이 바뀌면 앞 조합의 늦은 응답을 보이지 않는다", async () => {
    const { http, wrapper } = setup();
    let releaseFirst: (v: unknown) => void = () => {};
    let calls = 0;
    http.respond("/api/hypothesis/popularity", () => {
      calls++;
      if (calls === 1) return new Promise((resolve) => (releaseFirst = resolve));
      return { patterns: ["consecutive"] };
    });

    const { result, rerender } = renderHook(({ numbers }) => useCheckPopularityAction(numbers), {
      wrapper,
      initialProps: { numbers: [1, 2, 3, 4, 5, 6] as number[] | null },
    });
    rerender({ numbers: [7, 8, 9, 10, 11, 12] });
    await waitFor(() => expect(result.current.result?.patterns).toEqual(["consecutive"]));

    await act(async () => releaseFirst({ patterns: ["birthday"] }));
    expect(result.current.result?.patterns ?? null).not.toEqual(["birthday"]);
  });
});
