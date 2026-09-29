import type { User } from "../model/User.model.js";

/** 현재 요청의 사용자 식별 포트 — MVP: 게스트 고정 / 후속: Supabase Auth 세션 */
export interface IdentityPort {
  currentUser: () => Promise<User>;
}

export const IDENTITY_PORT = Symbol("IdentityPort");
