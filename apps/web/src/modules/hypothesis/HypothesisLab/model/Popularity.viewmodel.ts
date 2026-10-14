export type PopularityPattern = "birthday" | "consecutive" | "arithmetic" | "pastWinner";

const MESSAGES: Record<PopularityPattern, string> = {
  birthday: "모든 번호가 1~31 안에 있습니다. 생일 숫자로 고르는 사람이 많습니다.",
  consecutive: "연속된 번호가 3개 이상 이어집니다.",
  arithmetic: "번호가 같은 간격으로 늘어섭니다.",
  pastWinner: "과거 1등 조합과 똑같습니다.",
};

/** 표시 모델 — 현재 조합이 걸린 인기 패턴 */
export class PopularityViewModel {
  patterns!: PopularityPattern[];

  get messages(): string[] {
    return this.patterns.length > 0 ? this.patterns.map((p) => MESSAGES[p]) : ["알려진 인기 패턴이 없습니다."];
  }

  static from(patterns: readonly PopularityPattern[]): PopularityViewModel {
    return Object.assign(new PopularityViewModel(), { patterns: [...patterns] });
  }
}
