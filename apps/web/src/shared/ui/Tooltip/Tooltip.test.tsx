import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip } from ".";

describe("Tooltip", () => {
  it("말풍선 글이 role=tooltip 으로 있고 단추가 그것을 가리킨다", () => {
    render(<Tooltip text="출처" />);
    const tip = screen.getByRole("tooltip");
    expect(tip.textContent).toBe("출처");
    expect(screen.getByRole("button").getAttribute("aria-describedby")).toBe(tip.id);
  });
});
