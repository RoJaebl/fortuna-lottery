import { describe, expect, it } from "vitest";
import { runButtonLabel } from "./SimulationCard.presenter";

describe("runButtonLabel", () => {
  it("진행 중이면 확인 중, 아니면 조합이 있는지에 따라", () => {
    expect(runButtonLabel(true, true)).toBe("확인 중…");
    expect(runButtonLabel(false, true)).toBe("과거 전 회차 대입");
    expect(runButtonLabel(false, false)).toBe("먼저 번호를 생성하세요");
  });
});
