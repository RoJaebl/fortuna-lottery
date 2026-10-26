import { createStore } from "supa-store";
import { createResource } from "supa-store/query";
import { GeneratedCombinationViewModel } from "../_model/GeneratedCombination.viewmodel";
import type { GeneratorMode } from "../_model/GeneratorMode.model";
import { generatorGenerateRequest, generatorGenerateResponse } from "../_mapper/generatorGenerate.mapper";

/** 조합 생성 — 누를 때마다 새 조합을 받으므로 조회 없이 바꾸기만 둔다. 생성 결과는 presenter 가 공통 상태로 올린다 */
createStore("api.home.GeneratorCard.generator", (set, get, ctx) =>
  createResource(() => ({
    async generate(mode: GeneratorMode, selected: readonly number[]) {
      try {
        return GeneratedCombinationViewModel.from(
          generatorGenerateResponse(
            await ctx("infra.http").client.send("/api/generator", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(generatorGenerateRequest(mode, selected)),
            }),
          ),
        );
      } catch (e) {
        throw e instanceof Error ? e : new Error("생성에 실패했습니다");
      }
    },
  })),
);
