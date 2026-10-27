"use client";
import { memo, useCallback, useRef, type KeyboardEvent } from "react";
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
  /** 그리드 폭에 들어가는 칸 수를 알린다 — 폭이 바뀔 때마다 부른다 */
  onFit: (size: number) => void;
  timeline: {
    /** 창의 첫 회차 위치(0 부터) */
    start: number;
    maxStart: number;
    /** 창의 마지막 회차 위치(0 부터) — 재생 위치 점이 여기 선다 */
    end: number;
    /** 전 회차 수 */
    total: number;
    /** 위치(0 부터) → 회차 번호 */
    roundAt: (index: number) => number;
    onChange: (start: number) => void;
    /** 그 위치의 회차가 창의 맨 오른쪽에 오도록 옮긴다 */
    onSeek: (index: number) => void;
  };
}

/** 키 한 번에 옮기는 회차 수 — PageUp/PageDown 은 창 하나만큼 */
const STEP = 10;

/** 칸 한 변과 칸 사이(px) — 세로축 눈금이 칸 줄에 맞춰 서도록 같은 값을 쓴다 */
const CELL = 9;
const GAP = 1;

/** 세로축에 숫자를 적는 줄 — 9px 줄마다 적으면 글자가 겹친다 */
const TICKS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45];

/**
 * 회차 하나의 세로 45칸. 타임라인을 끌면 창 안의 열 대부분이 그대로이므로, 열을 회차로 키 잡고 memo 로 건너뛴다 —
 * 새로 들어온 회차의 열만 그린다. 열 객체는 표시 모델이 회차마다 같은 것을 돌려준다
 */
const RoundColumn = memo(function RoundColumn({ column }: { column: GridColumn }) {
  return (
    <div className="grid gap-px" style={{ gridTemplateRows: `repeat(45, ${CELL}px)`, gridTemplateColumns: `${CELL}px` }}>
      {column.cells.map(({ n, present, title }) => (
        <div
          key={n}
          title={title}
          className="rounded-[2px]"
          style={{
            backgroundColor: present ? ballColor(n).bg : "var(--ui-line)",
          }}
        />
      ))}
    </div>
  );
});

/** 그리드 왼쪽의 1~45 세로축 — 숫자 줄마다 짧은 눈금선을 긋는다 */
function NumberAxis() {
  return (
    <div aria-hidden className="relative w-7 shrink-0 text-nano tabular-nums text-muted" style={{ height: 45 * CELL + 44 * GAP }}>
      {TICKS.map((n) => (
        <span
          key={n}
          className="absolute right-0 flex -translate-y-1/2 items-center gap-1"
          style={{ top: (n - 1) * (CELL + GAP) + CELL / 2 }}
        >
          {n}
          <span className="h-px w-1.5 bg-muted" />
        </span>
      ))}
    </div>
  );
}

/** 잔디밭 — 가로 회차 / 세로 1~45, 출현 번호 칸을 공 색으로 칠한다. 아래 재생 바로 전 회차를 오간다 */
export function RecentGrid({ range, columns, onFit, timeline }: RecentGridProps) {
  const { start, maxStart, end, total, roundAt, onChange, onSeek } = timeline;
  const fitLatest = useRef(onFit);
  fitLatest.current = onFit;
  // 그리드 자리의 폭을 재어 들어가는 칸 수를 알린다 — 스크롤 없이 들어가는 만큼만 보이고 나머지는 재생 바로 본다
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      fitLatest.current(Math.max(1, Math.floor((width + GAP) / (CELL + GAP))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const trackRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Draggable | null>(null);
  // Draggable 은 한 번만 짓고 최신 값은 ref 로 읽는다
  const latest = useRef({ total, roundAt, onSeek });
  latest.current = { total, roundAt, onSeek };

  const width = () => trackRef.current?.clientWidth ?? 0;

  /** 바 위의 x(px) → 회차 위치(0 부터) */
  const indexAt = (x: number) => {
    const room = width();
    const last = latest.current.total - 1;
    return room > 0 ? Math.round(Math.min(Math.max(x / room, 0), 1) * last) : last;
  };

  /** 마우스·손잡이가 가리키는 자리 위에 「제N회」를 띄운다 — 상태 없이 DOM 에 바로 쓴다 */
  const showTip = (x: number) => {
    const tip = tipRef.current;
    if (!tip) return;
    tip.textContent = `제${latest.current.roundAt(indexAt(x))}회`;
    tip.style.left = `${Math.min(Math.max(x, 0), width())}px`;
    tip.style.opacity = "1";
  };
  const hideTip = () => {
    if (tipRef.current && !dragRef.current?.isDragging) tipRef.current.style.opacity = "0";
  };

  // 재생된 막대는 재생 위치 점을 따라간다
  const syncPlayed = () => {
    if (playedRef.current && headRef.current) playedRef.current.style.width = `${gsap.getProperty(headRef.current, "x")}px`;
  };

  useGSAP(() => {
    if (!headRef.current || !trackRef.current) return;
    dragRef.current = Draggable.create(headRef.current, {
      type: "x",
      onPress() {
        this.applyBounds({ minX: 0, maxX: width() });
      },
      onDrag() {
        syncPlayed();
        showTip(this.x);
        latest.current.onSeek(indexAt(this.x));
      },
      onRelease: hideTip,
    })[0] ?? null;
  }, []);

  // 창이 옮겨지거나 회차 수가 바뀌면 재생 위치 점을 창의 끝으로 미끄러뜨린다. 끄는 동안은 손이 자리를 정한다
  useGSAP(() => {
    if (!headRef.current || dragRef.current?.isDragging) return;
    const x = total > 1 ? (end / (total - 1)) * width() : 0;
    gsap.to(headRef.current, {
      x,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        syncPlayed();
        dragRef.current?.update();
      },
    });
  }, [end, total]);

  const pointerX = (e: { clientX: number }) => e.clientX - (trackRef.current?.getBoundingClientRect().left ?? 0);

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
      <div className="flex gap-1.5">
        <NumberAxis />
        <div ref={measureRef} className="min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max gap-px">
            {columns.map((column) => (
              <RoundColumn key={column.round} column={column} />
            ))}
          </div>
        </div>
      </div>
      {maxStart > 0 && (
        <div className="mt-4 pl-8.5">
          <div
            ref={trackRef}
            className="group relative h-4 cursor-pointer"
            onPointerMove={(e) => showTip(pointerX(e))}
            onPointerLeave={hideTip}
            onClick={(e) => onSeek(indexAt(pointerX(e)))}
          >
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-line transition-[height] group-hover:h-1.5" />
            <div
              ref={playedRef}
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-accent transition-[height] group-hover:h-1.5"
            />
            <div
              ref={headRef}
              role="slider"
              tabIndex={0}
              aria-label="잔디밭 회차 창"
              aria-valuemin={0}
              aria-valuemax={maxStart}
              aria-valuenow={start}
              aria-valuetext={first && last ? `제${first}회 ~ 제${last}회` : undefined}
              onKeyDown={onKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="absolute -left-1.5 top-1/2 -mt-1.5 size-3 cursor-grab rounded-pill bg-accent shadow outline-none transition-transform group-hover:scale-125 focus-visible:ring-2 focus-visible:ring-text active:cursor-grabbing"
            />
            <div
              ref={tipRef}
              aria-hidden
              className="pointer-events-none absolute bottom-full mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-button bg-text px-1.5 py-0.5 text-nano tabular-nums text-on-strong opacity-0 transition-opacity"
            />
          </div>
          <div className="mt-1 flex justify-between text-nano tabular-nums text-muted">
            <span>제{roundAt(0)}회</span>
            <span>제{roundAt(total - 1)}회</span>
          </div>
        </div>
      )}
    </Card>
  );
}
