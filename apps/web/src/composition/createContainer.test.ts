import { describe, expect, it } from "vitest";
import { DOMAIN_EVENTS } from "@infrastructure/events";
import { FetchHttpClient, HTTP_CLIENT, TEST_HTTP } from "@infrastructure/http";
import { createContainer } from "./createContainer";

describe("createContainer", () => {
  it("test 환경은 HTTP_CLIENT 에 TEST_HTTP 와 같은 인스턴스를 꽂는다", () => {
    const c = createContainer("test");
    expect(c.resolve(HTTP_CLIENT)).toBe(c.resolve(TEST_HTTP));
  });

  it("real 환경은 FetchHttpClient 를 꽂는다", () => {
    expect(createContainer("real").resolve(HTTP_CLIENT)).toBeInstanceOf(FetchHttpClient);
  });

  it("fake 환경은 아직 준비되지 않았다는 오류로 실패한다", () => {
    expect(() => createContainer("fake")).toThrow("아직 준비되지 않았다");
  });

  it("두 번 지은 컨테이너는 서로 다른 인스턴스를 쥔다", () => {
    expect(createContainer("test").resolve(DOMAIN_EVENTS)).not.toBe(createContainer("test").resolve(DOMAIN_EVENTS));
  });
});
