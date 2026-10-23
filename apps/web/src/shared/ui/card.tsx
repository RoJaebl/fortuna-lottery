import type { ReactNode } from "react";
import { cn } from "../lib/style/cn";
import { card } from "./card.styles";

interface CardProps {
  title: string;
  subtitle?: string;
  /** 정직성 각주 — "미래 예측이 아님" 등 */
  footnote?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, footnote, children, className }: CardProps) {
  const s = card();
  return (
    <section className={cn(s.root(), className)}>
      <header className={s.header()}>
        <h2 className={s.title()}>{title}</h2>
        {subtitle ? <p className={s.subtitle()}>{subtitle}</p> : null}
      </header>
      {children}
      {footnote ? <p className={s.footnote()}>⚠ {footnote}</p> : null}
    </section>
  );
}
