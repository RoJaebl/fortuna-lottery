import { GUEST_USER_ID, type User } from "../model/User.model.js";
import type { IdentityPort } from "../port/IdentityPort.js";

/** 게스트 고정 어댑터 (MVP) — 후속 SupabaseIdentityAdapter로 교체 */
export class GuestIdentityAdapter implements IdentityPort {
  currentUser = async (): Promise<User> => ({ id: GUEST_USER_ID, isGuest: true });
}
