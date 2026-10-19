import { describe, expect, it } from "vitest";
import { PopularityViewModel } from "./Popularity.viewmodel";

describe("PopularityViewModel.messages", () => {
  it("패턴마다 문구를 그 순서로", () => {
    expect(PopularityViewModel.from(["birthday", "consecutive"]).messages).toEqual([
      "모든 번호가 1~31 안에 있습니다. 생일 숫자로 고르는 사람이 많습니다.",
      "연속된 번호가 3개 이상 이어집니다.",
    ]);
  });

  it("패턴이 없으면 없다고", () => {
    expect(PopularityViewModel.from([]).messages).toEqual(["알려진 인기 패턴이 없습니다."]);
  });
});
