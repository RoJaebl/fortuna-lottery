import type { ReactNode } from "react";

interface CardProps {
  title: string;
  subtitle?: string;
  /** 정직성 각주 — "미래 예측이 아님" 등 */
  footnote?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, footnote, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </header>
      {children}
      {footnote ? (
        <p className="mt-4 border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-amber-600/90">
          ⚠ {footnote}
        </p>
      ) : null}
    </section>
  );
}
