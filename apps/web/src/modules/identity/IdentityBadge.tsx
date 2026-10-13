"use client";
import { useIdentityBadgePresenter } from "./IdentityBadge.presenter";

export function IdentityBadge() {
  const { label } = useIdentityBadgePresenter();
  return (
    <span className="rounded-full border border-line px-3 py-1 text-micro text-muted">
      {label}
    </span>
  );
}
