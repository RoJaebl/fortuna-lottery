import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { overrideStore } from "supa-store";
import { useStore } from "supa-store/react";
import { TestHttpClient } from "@infrastructure/http";

function setup() {
  const http = new TestHttpClient();
  overrideStore("infra.http", () => ({ client: http }));
  return http;
}

describe("api.home.HypothesisLab.popularity", () => {
  it("조합이 없으면 받지 않는다", () => {
    const http = setup();
    renderHook(() => useStore("api.home.HypothesisLab.popularity", { args: undefined }));
    expect(http.sent).toHaveLength(0);
  });

  it("조합이 A→B→A 로 바뀌면 늦게 온 A 의 첫 응답을 보이지 않는다", async () => {
    const http = setup();
    const resolvers: Array<(v: unknown) => void> = [];
    http.respond("/api/hypothesis/popularity", () => new Promise((resolve) => resolvers.push(resolve)));

    const A = [1, 2, 3, 4, 5, 6];
    const B = [7, 8, 9, 10, 11, 12];
    const { result, rerender } = renderHook(
      ({ numbers }) => useStore("api.home.HypothesisLab.popularity", { args: { numbers } }),
      { initialProps: { numbers: A } },
    );
    await waitFor(() => expect(resolvers).toHaveLength(1)); // A 첫 요청(낡을 것)
    rerender({ numbers: B });
    await waitFor(() => expect(resolvers).toHaveLength(2)); // B
    rerender({ numbers: A });
    await waitFor(() => expect(resolvers).toHaveLength(3)); // A 둘째 요청(최신)

    await act(async () => resolvers[2]?.({ patterns: ["consecutive"] })); // A 둘째 응답
    await act(async () => resolvers[0]?.({ patterns: ["birthday"] })); // 늦게 온 A 첫 응답
    expect(result.current.data?.patterns).toEqual(["consecutive"]);
  });
});
