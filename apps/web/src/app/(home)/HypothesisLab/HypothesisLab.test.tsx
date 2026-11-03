import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProbabilityTable } from "./ProbabilityTable";

const rows = {
  past: { title: "과거 비율을 믿는다면", sumInRange: "47.0% · 1,245회 중 585회", withinRange: "1 / 3,948,748", prize: "1 / 8,403,746" },
  theory: { title: "공정한 추첨이라면(이론)", sumInRange: "48.5%", withinRange: "1 / 3,948,748", prize: "1 / 8,145,060" },
};

describe("ProbabilityTable", () => {
  it("두 줄의 이름과 실제 당첨 확률 1 / 8,145,060 을 보인다", () => {
    render(<ProbabilityTable rows={rows} pastRowFolded={false} />);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("과거 비율을 믿는다면")).toBeTruthy();
    expect(screen.getByText("공정한 추첨이라면(이론)")).toBeTruthy();
    expect(screen.getByText("1 / 8,145,060")).toBeTruthy();
  });

  it("과거 비율로 계산이 꺼져 있으면 과거 줄을 접는다", () => {
    render(<ProbabilityTable rows={rows} pastRowFolded />);
    const pastRow = screen.getByText("과거 비율을 믿는다면").closest("tr")!;
    expect(pastRow.getAttribute("data-folded")).toBe("true");
  });
});
