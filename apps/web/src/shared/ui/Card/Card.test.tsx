import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Card } from ".";

describe("Card", () => {
  it("부모가 내린 안쪽 여백이 기본 여백을 이긴다", () => {
    const { container } = render(
      <Card title="t" className="p-3">
        x
      </Card>,
    );
    const cls = new Set(container.querySelector("section")!.className.split(" "));
    expect(cls.has("p-3")).toBe(true);
    expect(cls.has("p-5")).toBe(false);
  });

  it("className 을 내리지 않으면 끝에 빈 칸이 없다", () => {
    const { container } = render(<Card title="t">x</Card>);
    expect(container.querySelector("section")!.className).toBe("rounded-card border border-line bg-panel p-5");
  });
});
