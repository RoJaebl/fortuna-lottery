/** FE 모델 원형 — ViewModel은 이 인터페이스에만 의존한다 */
export interface LotterietusModel {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: Date;
  nextRound: number;
  nextDrawAt: Date;
}
