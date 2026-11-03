"use client";
import { useIdentityBadgePresenter } from "./IdentityBadge.presenter";

export function IdentityBadge() {
  const { label } = useIdentityBadgePresenter();
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-line/80 px-3 py-1 text-nano text-muted">
      <span aria-hidden className="size-1.5 rounded-full bg-muted/60" />
      {label}
    </span>
  );
}
