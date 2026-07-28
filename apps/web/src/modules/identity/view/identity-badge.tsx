"use client";
import { useIdentityViewModel } from "../viewmodel/use-identity.viewmodel";

export function IdentityBadge() {
  const { label } = useIdentityViewModel();
  return (
    <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500">
      {label}
    </span>
  );
}
