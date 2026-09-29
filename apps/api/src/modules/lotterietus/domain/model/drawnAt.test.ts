import { describe, expect, it } from "vitest";
import { drawnAtFromDate, drawnAtFromYmd } from "./drawnAt.js";

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

  it("월이 01~12 범위를 벗어나면 에러를 던진다 (Date.UTC 롤오버 방지)", () => {
    expect(() => drawnAtFromYmd("20261301")).toThrow();
    expect(() => drawnAtFromYmd("20260001")).toThrow();
  });

  it("일이 01~31 범위를 벗어나면 에러를 던진다 (Date.UTC 롤오버 방지)", () => {
    expect(() => drawnAtFromYmd("20260132")).toThrow();
    expect(() => drawnAtFromYmd("20260100")).toThrow();
  });

  it("해당 월에 실존하지 않는 날짜면 에러를 던진다 (월별 일수 롤오버 방지)", () => {
    expect(() => drawnAtFromYmd("20260230")).toThrow(); // 2월 30일
    expect(() => drawnAtFromYmd("20260431")).toThrow(); // 4월 31일
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
