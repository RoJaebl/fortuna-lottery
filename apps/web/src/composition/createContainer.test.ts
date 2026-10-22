import { describe, expect, it } from "vitest";
import { FetchHttpClient, TestHttpClient } from "@infrastructure/http";
import { createContainer } from "./createContainer";

describe("createContainer", () => {
  it("test 환경은 deps.http 에 TestHttpClient 를 꽂는다", () => {
    expect(createContainer("test").deps.http).toBeInstanceOf(TestHttpClient);
  });

  it("real 환경은 FetchHttpClient 를 꽂는다", () => {
    expect(createContainer("real").deps.http).toBeInstanceOf(FetchHttpClient);
  });

  it("fake 환경은 아직 준비되지 않았다는 오류로 실패한다", () => {
    expect(() => createContainer("fake")).toThrow("아직 준비되지 않았다");
  });

  it("두 번 지은 컨테이너는 서로 다른 캐시를 쥔다", () => {
    const c1 = createContainer("test");
    const c2 = createContainer("test");
    expect(c1.resolve("cache.statistics.get")).not.toBe(c2.resolve("cache.statistics.get"));
  });
});
