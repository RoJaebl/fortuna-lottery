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

describe("loadConfig — strictPort · FORTUNA_MODE", () => {
  it("FORTUNA_STRICT_PORT=1 일 때만 strictPort 가 켜진다", () => {
    expect(loadConfig({ FORTUNA_STRICT_PORT: "1" }).strictPort).toBe(true);
    expect(loadConfig({ FORTUNA_STRICT_PORT: "0" }).strictPort).toBe(false);
    expect(loadConfig({}).strictPort).toBe(false);
  });

  it("port 는 PORT 를 읽고 없으면 4000 이다", () => {
    expect(loadConfig({ PORT: "4123" }).port).toBe(4123);
    expect(loadConfig({}).port).toBe(4000);
  });

  it("FORTUNA_MODE 가 npm_lifecycle_event 보다 먼저 스케줄러 기본값을 정한다", () => {
    expect(loadConfig({ FORTUNA_MODE: "dev", npm_lifecycle_event: "start" }).schedulerEnabled).toBe(false);
    expect(loadConfig({ FORTUNA_MODE: "start", npm_lifecycle_event: "dev" }).schedulerEnabled).toBe(true);
    expect(loadConfig({ FORTUNA_MODE: "dev" }).schedulerEnabled).toBe(false);
  });

  it("FORTUNA_MODE 가 있어도 SCHEDULER_ENABLED 를 적으면 그 값이 이긴다", () => {
    expect(loadConfig({ FORTUNA_MODE: "dev", SCHEDULER_ENABLED: "true" }).schedulerEnabled).toBe(true);
    expect(loadConfig({ FORTUNA_MODE: "start", SCHEDULER_ENABLED: "false" }).schedulerEnabled).toBe(false);
  });
});
