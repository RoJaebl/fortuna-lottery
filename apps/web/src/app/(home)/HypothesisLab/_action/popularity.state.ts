import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import { hypothesisPopularityRequest, hypothesisPopularityResponse } from "../_mapper/hypothesisPopularity.mapper";

/** 인기 패턴 — 조합이 인자이고 그 내용이 곧 칸이다. 조합이 없으면 받지 않는다.
 * 인자는 { numbers } 로 묶는다 — 맨 배열을 args 로 주면 supa-store 가 목록 꼴로 읽는다 */
createStore("api.home.HypothesisLab.popularity", (set, get, ctx) =>
  createResource(() => ({
    query: async ({ numbers }: { numbers: readonly number[] }) => {
      try {
        return hypothesisPopularityResponse(
          await ctx("infra.http").client.send("/api/hypothesis/popularity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hypothesisPopularityRequest(numbers)),
          }),
        );
      } catch (e) {
        throw e instanceof Error ? e : new Error("인기 패턴 확인에 실패했습니다");
      }
    },
  })),
);
