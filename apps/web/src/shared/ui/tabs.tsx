"use client";

import { tabs } from "./tabs.styles";

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

export interface TabsProps<K extends string> {
  items: readonly TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  /** underline = 최상단 내비게이션, chip = 패널 내부 서브탭 (설계 문서 §7) */
  variant?: "underline" | "chip";
  /** 스크린리더용 탭 목록 이름 */
  label: string;
}

export function Tabs<K extends string>({
  items,
  active,
  onChange,
  variant = "underline",
  label,
}: TabsProps<K>) {
  const s = tabs({ variant });

  return (
    <div role="tablist" aria-label={label} className={s.list()}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.key)}
            className={s.item({ selected })}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
