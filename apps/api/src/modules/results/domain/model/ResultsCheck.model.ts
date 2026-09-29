/** 대조 기준 회차 — 한 회차 추첨 결과 */
export interface CheckDraw {
  readonly round: number;
  /** 당첨 번호 6개 (오름차순) */
  readonly numbers: readonly number[];
  readonly bonus: number;
  /** 추첨 시각 ISO 문자열 */
  readonly drawnAt: string;
}

/** 대조할 픽 하나 — 사용자 정보는 이미 걸러져 있다 */
export interface PickToCheck {
  readonly id: string;
  readonly numbers: readonly number[];
  readonly createdAt: string;
}

/** 대조할 재료 — 기준 회차(최신 회차) 하나와 그 회차에 대조할 사용자의 픽 전부. 회차가 없으면 draw 가 null 이다 */
export interface ResultsCheckInput {
  readonly draw: CheckDraw | null;
  readonly picks: readonly PickToCheck[];
}

/** 픽 하나의 채점 결과 — 근접 정도(matchedNumbers)는 사실 그대로다 (과장 없음 — 다크패턴 회피) */
export interface CheckedPick {
  readonly pickId: string;
  readonly numbers: readonly number[];
  readonly matchedNumbers: readonly number[];
  readonly matchedCount: number;
  readonly bonusMatched: boolean;
  /** 0 = 낙첨, 1~5 = 등수 */
  readonly rank: number;
}

/** 당첨 대조 결과 — 대조 기준 회차 + 픽별 채점 결과(최신 저장순) */
export interface ResultsCheck {
  readonly draw: CheckDraw | null;
  readonly items: readonly CheckedPick[];
}
