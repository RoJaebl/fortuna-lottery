import { describe, expect, it } from "vitest";
import { drawnAtFromDate, drawnAtFromYmd } from "./drawn-at";

describe("drawnAtFromYmd (동행복권 추첨일 → ISO)", () => {
  it("YYYYMMDD를 그 날짜의 정식 추첨 시각(11:35 UTC = 20:35 KST) ISO로 바꾼다", () => {
    expect(drawnAtFromYmd("20260801")).toBe("2026-08-01T11:35:00.000Z");
  });

  it("1회차 추첨일(2002-12-07)도 같은 규칙으로 변환한다", () => {
    expect(drawnAtFromYmd("20021207")).toBe("2002-12-07T11:35:00.000Z");
  });

  it("8자리 숫자가 아니면 에러를 던진다", () => {
    expect(() => drawnAtFromYmd("2026-08-01")).toThrow();
    expect(() => drawnAtFromYmd("")).toThrow();
  });
});

describe("drawnAtFromDate (DB date 컬럼 → ISO)", () => {
  it("자정 UTC Date를 같은 날짜의 추첨 시각 ISO로 바꾼다", () => {
    expect(drawnAtFromDate(new Date("2026-08-01T00:00:00.000Z"))).toBe(
      "2026-08-01T11:35:00.000Z",
    );
  });

  it("원격 → DB → 앱 왕복에서 값이 변하지 않는다", () => {
    const fromRemote = drawnAtFromYmd("20260801");
    // Prisma의 @db.Date는 날짜만 저장하므로 읽을 때 자정 UTC로 돌아온다
    const fromDb = new Date("2026-08-01T00:00:00.000Z");
    expect(drawnAtFromDate(fromDb)).toBe(fromRemote);
  });
});
