import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig — 스케줄러 기본값", () => {
  it("dev 스크립트에서는 꺼져 있다", () => {
    expect(loadConfig({ npm_lifecycle_event: "dev" }).schedulerEnabled).toBe(false);
  });

  it("start 스크립트와 스크립트 밖에서는 켜져 있다", () => {
    expect(loadConfig({ npm_lifecycle_event: "start" }).schedulerEnabled).toBe(true);
    expect(loadConfig({}).schedulerEnabled).toBe(true);
  });

  it("SCHEDULER_ENABLED 를 적으면 그 값이 이긴다", () => {
    expect(loadConfig({ npm_lifecycle_event: "dev", SCHEDULER_ENABLED: "true" }).schedulerEnabled).toBe(true);
    expect(loadConfig({ npm_lifecycle_event: "start", SCHEDULER_ENABLED: "false" }).schedulerEnabled).toBe(false);
  });
});
