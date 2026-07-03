/** 추첨 스케줄 — 매주 토요일 20:35 KST (= 11:35 UTC) */
const DRAW_UTC_HOUR = 11;
const DRAW_UTC_MINUTE = 35;
const SATURDAY = 6;

/** 기준 시각 이후 가장 가까운 추첨 시각을 반환한다. */
export function nextDrawAt(now: Date): Date {
  const candidate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      DRAW_UTC_HOUR,
      DRAW_UTC_MINUTE,
      0,
      0,
    ),
  );
  const daysUntilSaturday = (SATURDAY - candidate.getUTCDay() + 7) % 7;
  candidate.setUTCDate(candidate.getUTCDate() + daysUntilSaturday);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }
  return candidate;
}
