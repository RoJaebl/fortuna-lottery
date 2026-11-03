import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SumDistributionChart } from "./SumDistributionChart";

describe("SumDistributionChart 구간표 단추", () => {
  it("보이는 글자가 줄어도 접근 이름은 「이 구간으로 실험하기」이고 누르면 onExperiment 를 부른다", () => {
    const onExperiment = vi.fn();
    render(
      <SumDistributionChart
        chart={{ minSum: 21, maxSum: 255, maxCount: 1, points: [], xTicks: [], yTicks: [] } as never}
        subtitle=""
        marker={null}
        axis={{ items: [], active: "relative" as never, onChange: () => {} }}
        bands={[{ label: "21~40", count: 1, percent: 1, mine: false, onExperiment }]}
        timeline={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "이 구간으로 실험하기" }));
    expect(onExperiment).toHaveBeenCalledOnce();
  });
});
