/**
 * identity 도메인 — MVP는 게스트 단일 사용자.
 * 후속: Supabase Auth 어댑터로 실제 사용자 식별 (users 테이블은 인증/프로필만 책임).
 */
export const GUEST_USER_ID = "guest";

export interface User {
  readonly id: string;
  readonly isGuest: boolean;
}
