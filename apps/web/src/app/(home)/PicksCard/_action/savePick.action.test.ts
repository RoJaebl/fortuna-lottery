import { describe, expect, it, vi } from "vitest";
import { createContainer } from "@composition/createContainer";

describe("savePick", () => {
  it("실패하면 사건을 내지 않는다", async () => {
    const c = createContainer("test");
    c.deps.http.respond("/api/picks", () => {
      throw new Error("저장 거절");
    });
    const heard = vi.fn();
    c.deps.events.on("event.picks.saved", heard);
    await expect(c.resolve("http.picks.save")([1, 2, 3, 4, 5, 6])).rejects.toThrow("저장 거절");
    expect(heard).not.toHaveBeenCalled();
  });
});
