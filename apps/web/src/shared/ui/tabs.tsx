"use client";

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

/** 최상단 내비게이션 — 밑줄로 "지금 보고 있는 화면"을 표시 (CTA의 채움 버튼과 구분) */
const UNDERLINE = {
  list: "flex gap-1 border-b border-line",
  item: "-mb-px border-b-2 px-3 py-2 text-small font-medium transition-colors",
  active: "border-text text-text",
  inactive: "border-transparent text-muted hover:text-text",
};

/** 패널 내부 서브탭 — 칩 형태로 최상단 탭과 위계를 구분. 모바일은 한 줄 가로 스크롤 */
const CHIP = {
  list: "flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-gutter:stable] md:flex-wrap md:overflow-x-visible",
  item: "shrink-0 rounded-box px-3 py-2 text-micro font-semibold transition-colors",
  active: "bg-text text-bg",
  inactive: "bg-said text-muted hover:bg-inset",
};

export function Tabs<K extends string>({
  items,
  active,
  onChange,
  variant = "underline",
  label,
}: TabsProps<K>) {
  const style = variant === "chip" ? CHIP : UNDERLINE;

  return (
    <div role="tablist" aria-label={label} className={style.list}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.key)}
            className={`${style.item} ${selected ? style.active : style.inactive}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
