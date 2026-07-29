/** 회차 조회 응답 DTO — 와이어 계약 (클라이언트 무관) */
export interface DrawResponse {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: string;
}
