import { DRAW_UTC_HOUR, DRAW_UTC_MINUTE } from "./schedule";

/** UTC 연·월·일에 정식 추첨 시각을 붙여 ISO 문자열로 만든다 */
function atDrawTime(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day, DRAW_UTC_HOUR, DRAW_UTC_MINUTE)).toISOString();
}

/**
 * 동행복권 `ltRflYmd`("20260801") → `Draw.drawnAt` ISO 문자열.
 * 원격은 날짜만 주므로 그 날짜의 정식 추첨 시각(20:35 KST)을 붙인다.
 */
export function drawnAtFromYmd(ymd: string): string {
  if (!/^\d{8}$/.test(ymd)) {
    throw new Error(`추첨일 형식이 올바르지 않습니다 (YYYYMMDD 필요): ${ymd}`);
  }
  const month = Number(ymd.slice(4, 6));
  const day = Number(ymd.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`추첨일 월/일이 범위를 벗어났습니다 (YYYYMMDD): ${ymd}`);
  }
  return atDrawTime(Number(ymd.slice(0, 4)), month - 1, day);
}

/**
 * DB `date` 컬럼에서 읽은 Date(자정 UTC) → `Draw.drawnAt` ISO 문자열.
 * drawnAtFromYmd와 같은 규칙을 쓰므로 원격 → DB → 앱 왕복에서 값이 변하지 않는다.
 */
export function drawnAtFromDate(date: Date): string {
  return atDrawTime(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
