import { describe, expect, it } from "vitest";
import { PickModel } from "../../model/Pick.model";
import { listPicksResponse } from "./listPicks.mapper";

describe("listPicks 변환기", () => {
  it("응답을 도메인 원형으로 옮긴다 (날짜 파싱)", () => {
    const [model] = listPicksResponse([
      {
        id: "p1",
        numbers: [1, 2, 3, 4, 5, 6],
        createdAt: "2026-07-03T12:00:00.000Z",
      },
    ]);
    expect(model).toBeInstanceOf(PickModel);
    expect(model?.id).toBe("p1");
    expect(model?.createdAt).toBeInstanceOf(Date);
    expect(model?.createdAt.toISOString()).toBe("2026-07-03T12:00:00.000Z");
  });
});
