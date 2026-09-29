// 번호 배열 하나만 보는 규칙 — 표시 조정자가 내 조합의 위치를 잴 때 쓴다

/** 조합 합계 */
export function sumOf(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

/** 홀수 개수 */
export function oddCountOf(numbers: number[]): number {
  return numbers.filter((n) => n % 2 === 1).length;
}

/** 저구간(1~22) 개수 */
export function lowCountOf(numbers: number[]): number {
  return numbers.filter((n) => n <= 22).length;
}
