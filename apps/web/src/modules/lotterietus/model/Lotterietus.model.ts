/** 도메인 원형 — 최근 회차와 다음 추첨 */
export class LotterietusModel {
  round!: number;
  numbers!: number[];
  bonus!: number;
  drawnAt!: Date;
  nextRound!: number;
  nextDrawAt!: Date;
}
