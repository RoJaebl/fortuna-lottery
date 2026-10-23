import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./formatDate";

describe("formatDate", () => {
  it("YYYY.MM.DD — 한 자리 월·일은 0 으로 채운다 (로컬 시각)", () => {
    expect(formatDate(new Date(2026, 0, 3, 23, 59))).toBe("2026.01.03");
    expect(formatDate(new Date(2026, 11, 25))).toBe("2026.12.25");
  });
});

describe("formatDateTime", () => {
  it("YYYY.MM.DD HH:mm — 시·분도 0 으로 채운다 (로컬 시각)", () => {
    expect(formatDateTime(new Date(2026, 0, 3, 4, 5))).toBe("2026.01.03 04:05");
    expect(formatDateTime(new Date(2026, 11, 25, 18, 30))).toBe("2026.12.25 18:30");
  });
});
