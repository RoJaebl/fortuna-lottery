"use client";

/** MVP: 게스트 고정 — 후속 Supabase Auth 연동 시 세션 기반으로 교체 */
export function useIdentityBadgePresenter() {
  return { label: "게스트 모드", isGuest: true };
}
