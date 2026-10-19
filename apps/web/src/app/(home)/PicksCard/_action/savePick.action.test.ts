import { describe, expect, it, vi } from "vitest";
import { DOMAIN_EVENTS } from "@infrastructure/events";
import { TEST_HTTP } from "@infrastructure/http";
import { createContainer } from "@composition/createContainer";
import { PICKS_SAVED, SAVE_PICK } from "./savePick.action";

describe("savePick", () => {
  it("실패하면 사건을 내지 않는다", async () => {
    const c = createContainer("test");
    c.resolve(TEST_HTTP).respond("/api/picks", () => {
      throw new Error("저장 거절");
    });
    const heard = vi.fn();
    c.resolve(DOMAIN_EVENTS).on(PICKS_SAVED, heard);
    await expect(c.resolve(SAVE_PICK)([1, 2, 3, 4, 5, 6])).rejects.toThrow("저장 거절");
    expect(heard).not.toHaveBeenCalled();
  });
});
