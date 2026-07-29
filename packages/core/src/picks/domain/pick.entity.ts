/**
 * 저장된 픽 — picks 테이블과 1:1 (도메인 단일 책임 규칙).
 * 사용자 정보는 userId 키로만 연결한다. users 테이블에 픽 정보를 두지 않는다.
 */
export interface PickEntity {
  readonly id: string;
  readonly userId: string;
  readonly numbers: readonly number[];
  readonly createdAt: string;
}
