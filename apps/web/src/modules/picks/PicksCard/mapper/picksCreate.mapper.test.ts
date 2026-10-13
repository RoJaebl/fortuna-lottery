import { describe, expect, it } from "vitest";
import { picksCreateRequest } from "./picksCreate.mapper";

describe("picksCreate 변환기", () => {
  it("FE 배열을 요청으로 (원본 비공유 복사)", () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const req = picksCreateRequest(numbers);
    expect(req).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
    expect(req.numbers).not.toBe(numbers);
  });
});
