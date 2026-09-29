"use client";
import { useIdentityBadgePresenter } from "./IdentityBadge.presenter";

export function IdentityBadge() {
  const { label } = useIdentityBadgePresenter();
  return (
    <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500">
      {label}
    </span>
  );
}
