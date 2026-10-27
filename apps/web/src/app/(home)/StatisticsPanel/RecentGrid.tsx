"use client";
import { memo, useCallback, useRef } from "react";
import { ballColor } from "@lib/lotto-colors";
import { Card } from "@ui/Card";
import type { GridColumn } from "./_model/Statistics.viewmodel";
import { RoundTimeline, type RoundTimelineProps } from "./RoundTimeline";

export interface RecentGridProps {
  /** 회차 범위 문구 — 회차가 없으면 빈 문자열 */
  range: string;
  /** 창 안의 회차만 */
  columns: GridColumn[];
  /** 그리드 폭에 들어가는 칸 수를 알린다 — 폭이 바뀔 때마다 부른다 */
  onFit: (size: number) => void;
  /** 재생 바 — 재생 위치는 창의 마지막 회차다. 전 회차가 한 창에 들어가면 null 이고 그리지 않는다 */
  timeline: RoundTimelineProps | null;
}

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
      {timeline && (
        <div className="mt-4 pl-8.5">
          <RoundTimeline {...timeline} />
        </div>
      )}
    </Card>
  );
}
