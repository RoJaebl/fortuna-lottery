"use client";
import { memo, useRef, type KeyboardEvent } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";
import { ballColor } from "@lib/lotto-colors";
import { Card } from "@ui/Card";
import type { GridColumn } from "./_model/Statistics.viewmodel";

gsap.registerPlugin(Draggable, useGSAP);

export interface RecentGridProps {
  /** 회차 범위 문구 — 회차가 없으면 빈 문자열 */
  range: string;
  /** 창 안의 회차만 */
  columns: GridColumn[];
  timeline: {
    /** 창의 첫 회차 위치(0 부터) */
    start: number;
    maxStart: number;
    /** 전 회차 수 */
    total: number;
    onChange: (start: number) => void;
  };
}

/** 키 한 번에 옮기는 회차 수 — PageUp/PageDown 은 창 하나만큼 */
const STEP = 10;

/**
 * 회차 하나의 세로 45칸. 타임라인을 끌면 창 안의 열 대부분이 그대로이므로, 열을 회차로 키 잡고 memo 로 건너뛴다 —
 * 새로 들어온 회차의 열만 그린다. 열 객체는 표시 모델이 회차마다 같은 것을 돌려준다
 */
const RoundColumn = memo(function RoundColumn({ column }: { column: GridColumn }) {
  return (
    <div className="grid gap-px" style={{ gridTemplateRows: "repeat(45, 9px)", gridTemplateColumns: "9px" }}>
      {column.cells.map(({ n, present, title }) => (
        <div
          key={n}
          title={title}
          className="rounded-none"
          style={{
            backgroundColor: present ? ballColor(n).bg : "var(--ui-line)",
          }}
        />
      ))}
    </div>
  );
});

/** 잔디밭 — 가로 회차 / 세로 1~45, 출현 번호 칸을 공 색으로 칠한다. 아래 타임라인을 끌어 전 회차를 오간다 */
export function RecentGrid({ range, columns, timeline }: RecentGridProps) {
  const { start, maxStart, total, onChange } = timeline;
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Draggable | null>(null);
  // Draggable 은 한 번만 짓고 최신 값은 ref 로 읽는다
  const latest = useRef({ maxStart, onChange });
  latest.current = { maxStart, onChange };

  // 손잡이가 움직일 수 있는 폭(px)
  const travel = () => (trackRef.current?.clientWidth ?? 0) - (thumbRef.current?.offsetWidth ?? 0);

  useGSAP(() => {
    if (!thumbRef.current || !trackRef.current) return;
    dragRef.current = Draggable.create(thumbRef.current, {
      type: "x",
      bounds: trackRef.current,
      onDrag() {
        const room = travel();
        latest.current.onChange(room > 0 ? Math.round((this.x / room) * latest.current.maxStart) : 0);
      },
    })[0] ?? null;
  }, []);

  // 키보드로 옮기거나 회차 수가 바뀌면 손잡이를 그 자리로 미끄러뜨린다. 끄는 동안은 손이 자리를 정한다
  useGSAP(() => {
    if (!thumbRef.current || dragRef.current?.isDragging) return;
    const x = maxStart > 0 ? (start / maxStart) * travel() : 0;
    gsap.to(thumbRef.current, { x, duration: 0.3, ease: "power2.out", onUpdate: () => {
      dragRef.current?.update();
    } });
  }, [start, maxStart]);

  const onKeyDown = (e: KeyboardEvent) => {
    const next = {
      ArrowLeft: start - STEP,
      ArrowRight: start + STEP,
      PageUp: start - columns.length,
      PageDown: start + columns.length,
      Home: 0,
      End: maxStart,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(Math.min(Math.max(0, next), maxStart));
  };

  const first = columns[0]?.round;
  const last = columns[columns.length - 1]?.round;

  return (
    <Card title="회차별 잔디밭" subtitle={range}>
      <div className="overflow-x-auto [scrollbar-gutter:stable]">
        <div className="flex w-max gap-px">
          {columns.map((column) => (
            <RoundColumn key={column.round} column={column} />
          ))}
        </div>
      </div>
      {maxStart > 0 && (
        <div className="mt-4">
          <div ref={trackRef} className="relative h-6 rounded-full bg-line">
            <div
              ref={thumbRef}
              role="slider"
              tabIndex={0}
              aria-label="잔디밭 회차 창"
              aria-valuemin={0}
              aria-valuemax={maxStart}
              aria-valuenow={start}
              aria-valuetext={first && last ? `제${first}회 ~ 제${last}회` : undefined}
              onKeyDown={onKeyDown}
              className="absolute inset-y-0 left-0 cursor-grab rounded-full bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-text active:cursor-grabbing"
              style={{ width: `${(columns.length / total) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-nano tabular-nums text-muted">
            <span>처음</span>
            <span>최신</span>
          </div>
        </div>
      )}
    </Card>
  );
}
