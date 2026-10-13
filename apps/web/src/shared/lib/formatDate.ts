const pad = (n: number) => String(n).padStart(2, "0");

/** 날짜 표기 — YYYY.MM.DD (로컬 시각) */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 날짜·시각 표기 — YYYY.MM.DD HH:mm (로컬 시각) */
export function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
