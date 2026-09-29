/**
 * 저장된 픽 — 도메인 원형. 옛 PickEntity(저장 행)와 PickVO(검증된 조합)가 하나로 합쳐졌다.
 * 사용자 정보는 userId 키로만 연결한다. 조합의 검증(6개·1~45·중복 없음)은 business/SavePick 이 kernel 로 한다.
 */
export interface Pick {
  readonly id: string;
  readonly userId: string;
  readonly numbers: readonly number[];
  readonly createdAt: string;
}
