/** 조합 생성 요청 DTO — 자동(빈 fixed) / 부분 선택 / 직접 입력(6개 fixed) */
export interface GenerateRequest {
  fixedNumbers?: number[];
  excludedNumbers?: number[];
}

export interface GenerateResponse {
  numbers: number[];
}
