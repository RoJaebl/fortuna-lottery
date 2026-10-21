import { describe, expect, it, vi } from "vitest";
import { EventChannel } from "./EventChannel";

describe("EventChannel", () => {
  it("낸 사건을 듣고, 푼 뒤에는 듣지 않는다", () => {
    const events = new EventChannel();
    const fn = vi.fn();
    const off = events.on("saved", fn);
    events.emit("saved", 1);
    off();
    events.emit("saved", 2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });
});
