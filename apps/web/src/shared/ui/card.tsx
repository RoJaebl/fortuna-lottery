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
    <section className={`rounded-card border border-line bg-panel p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="text-body font-semibold text-text">{title}</h2>
        {subtitle ? <p className="mt-1 text-micro text-muted">{subtitle}</p> : null}
      </header>
      {children}
      {footnote ? (
        <p className="mt-4 border-t border-line pt-2 text-micro leading-relaxed text-warn">
          ⚠ {footnote}
        </p>
      ) : null}
    </section>
  );
}
