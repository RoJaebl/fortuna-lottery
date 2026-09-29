import { mulberry32 } from "@fortuna-lottery/kernel";
import { describe, expect, it } from "vitest";
import { GenerateCombination } from "./GenerateCombination.js";

describe("GenerateCombination", () => {
  it("주입한 난수로 조합을 만든다 — 같은 시드면 같은 조합", () => {
    const a = new GenerateCombination(mulberry32(42)).execute({});
    const b = new GenerateCombination(mulberry32(42)).execute({});

    expect(a.ok && a.value).toHaveLength(6);
    expect(a.ok && [...a.value]).toEqual(b.ok && [...b.value]);
  });

  it("요청의 고정·제외 번호를 도메인 규칙에 넘긴다", () => {
    const usecase = new GenerateCombination(mulberry32(1));

    expect(usecase.execute({ fixedNumbers: [7], excludedNumbers: [7] }).ok).toBe(false);
    expect(usecase.execute({ fixedNumbers: [45, 1, 22, 7, 33, 14] })).toEqual({
      ok: true,
      value: [1, 7, 14, 22, 33, 45],
    });
  });
});
