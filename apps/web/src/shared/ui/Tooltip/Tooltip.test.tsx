import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip } from ".";

describe("Tooltip", () => {
  it("기본 단추의 이름은 도움말이고 말풍선 글이 설명으로 걸린다", () => {
    render(<Tooltip text="출처" />);
    const tip = screen.getByRole("tooltip");
    expect(tip.textContent).toBe("출처");
    const button = screen.getByRole("button", { name: "도움말" });
    expect(button.getAttribute("aria-describedby")).toBe(tip.id);
  });

  it("children 을 주면 단추의 이름은 보이는 글이고 말풍선 글은 설명으로만 걸린다", () => {
    render(<Tooltip text="출처">합계 구간</Tooltip>);
    const tip = screen.getByRole("tooltip");
    const button = screen.getByRole("button", { name: "합계 구간" });
    expect(button.hasAttribute("aria-label")).toBe(false);
    expect(button.getAttribute("aria-describedby")).toBe(tip.id);
    expect(tip.textContent).toBe("출처");
  });
});
