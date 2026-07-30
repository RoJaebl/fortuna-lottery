/** 로또 현황 응답 DTO — 최근 회차 + 다음 추첨 정보 (와이어 계약, 클라이언트 무관) */
export interface LotterietusStatusResponse {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: string;
  nextRound: number;
  nextDrawAt: string;
}
