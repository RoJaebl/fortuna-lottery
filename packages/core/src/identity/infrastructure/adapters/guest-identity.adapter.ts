import { GUEST_USER_ID } from "../../domain/user";
import type { IdentityPort } from "../../application/ports/identity.port";

/** 게스트 고정 어댑터 (MVP) — 후속 SupabaseIdentityAdapter로 교체 */
export function createGuestIdentityAdapter(): IdentityPort {
  return {
    async getCurrentUser() {
      return { id: GUEST_USER_ID, isGuest: true };
    },
  };
}
