"use client";
import { memo, useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ballColor } from "@lib/lotto-colors";
import { Card } from "@ui/Card";
import type { GridColumn } from "./_model/Statistics.viewmodel";
import { RoundTimeline, type RoundTimelineProps } from "./RoundTimeline";

gsap.registerPlugin(useGSAP);

export interface RecentGridProps {
  /** 회차 범위 문구 — 회차가 없으면 빈 문자열 */
  range: string;
  /** 창 안의 회차만 */
  columns: GridColumn[];
  /** 창 양옆의 버퍼 열(같은 개수) — 흐리게 지워 그린다. 회차가 없는 자리는 null 이고 빈칸으로 둔다 */
  before: (GridColumn | null)[];
  after: (GridColumn | null)[];
  /** 그리드 폭에 들어가는 칸 수를 알린다 — 폭이 바뀔 때마다 부른다 */
  onFit: (size: number) => void;
  /** 재생 바 — 재생 위치는 창의 마지막 회차다. 전 회차가 한 창에 들어가면 null 이고 그리지 않는다 */
  timeline: RoundTimelineProps | null;
}

/** 칸 한 변과 칸 사이(px) — 세로축 눈금이 칸 줄에 맞춰 서도록 같은 값을 쓴다 */
const CELL = 9;
const GAP = 1;

/** 이보다 많이 건너뛰면 미끄러뜨리지 않는다 — 수백 칸을 미끄러뜨리면 흐릿한 줄무늬만 지나간다 */
const SLIDE_LIMIT = 30;

/** 그리드 양옆을 흐리게 지우는 폭(px) — 열 넷 */
const FADE = 4 * (CELL + GAP);

/** 한 번 옮길 때 띠가 미끄러지는 시간(초) */
const SLIDE_SECONDS = 0.35;

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

/** 회차가 없는 버퍼 자리 — 열 하나 폭의 빈칸 */
function EmptyColumn() {
  return <div aria-hidden className="shrink-0" style={{ width: CELL }} />;
}

/** 그리드 왼쪽의 1~45 세로축 — 숫자 줄마다 짧은 눈금선을 긋는다 */
function NumberAxis() {
  return (
    <div aria-hidden className="relative w-6 shrink-0 text-pico tabular-nums text-muted" style={{ height: 45 * CELL + 44 * GAP }}>
      {TICKS.map((n) => (
        <span
          key={n}
          className="absolute right-0 flex -translate-y-1/2 items-center gap-1"
          style={{ top: (n - 1) * (CELL + GAP) + CELL / 2 }}
        >
          {n}
          <span className="h-px w-1 bg-line" />
        </span>
      ))}
    </div>
  );
}

/** 잔디밭 — 가로 회차 / 세로 1~45, 출현 번호 칸을 공 색으로 칠한다. 아래 재생 바로 전 회차를 오간다 */
export function RecentGrid({ range, columns, before, after, onFit, timeline }: RecentGridProps) {
  // 버퍼 열이 차지하는 폭. 그 가운데 FADE 만큼은 흐림 구간 안에 서고, 나머지(slack)는 흐림 구간 바깥에 숨는다.
  // 띠가 slack 만큼 밀려도 흐림 구간에는 언제나 버퍼 열이 남는다
  const buffer = before.length * (CELL + GAP);
  const slack = Math.max(0, buffer - FADE);
  const fitLatest = useRef(onFit);
  fitLatest.current = onFit;
  // 그리드 자리의 폭에서 양옆 흐림 구간을 뺀 만큼 들어가는 칸 수를 알린다 — 스크롤 없이 보이고 나머지는 재생 바로 본다
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = (entry?.contentRect.width ?? 0) - 2 * FADE;
      fitLatest.current(Math.max(1, Math.floor((width + GAP) / (CELL + GAP))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 창이 옮겨지면 칸 띠를 옛 자리에서 새 자리로 미끄러뜨린다 — 열이 한 칸씩 툭툭 넘어가지 않고 흐르듯 지나간다.
  // 재생 중에는 앞선 미끄러짐이 끝나기 전에 다음 회차가 오므로, 지금 남은 거리에 새 거리를 더해 이어 간다
  const stripRef = useRef<HTMLDivElement>(null);
  const first = columns[0]?.round ?? 0;
  const prevFirst = useRef(first);
  const lastMoveAt = useRef(0);
  useGSAP(() => {
    const strip = stripRef.current;
    const moved = first - prevFirst.current;
    prevFirst.current = first;
    if (!strip || moved === 0) return;
    // 앞선 이동에서 지난 시간 — 재생처럼 잇달아 오면 짧다
    const now = performance.now();
    const interval = (now - lastMoveAt.current) / 1000;
    lastMoveAt.current = now;
    if (Math.abs(moved) > SLIDE_LIMIT) {
      // 멀리 건너뛰면 미끄러뜨리지 않고 살짝 비추어 바뀐 것만 알린다
      gsap.fromTo(strip, { x: 0, opacity: 0.35 }, { opacity: 1, duration: 0.35, ease: "power2.out", overwrite: true });
      return;
    }
    // slack 보다 멀리 밀지 않는다 — 빠른 배속에서 거리가 쌓여도 흐림 구간에 버퍼 열이 남게
    const pending = Number(gsap.getProperty(strip, "x")) + moved * (CELL + GAP);
    const from = Math.min(Math.max(pending, -slack), slack);
    // 미끄러지는 시간을 이동 간격에 맞춘다 — 잇달아 오면 다음 이동이 올 때쯤 제자리에 닿도록 고르게 흐르고,
    // 한 번 옮길 때만 감속하며 멈춘다. 고정 시간이면 빠른 배속에서 밀린 거리가 쌓여 상한에 붙는다
    const streaming = interval < SLIDE_SECONDS;
    gsap.fromTo(
      strip,
      { x: from },
      {
        x: 0,
        opacity: 1,
        duration: streaming ? interval : SLIDE_SECONDS,
        ease: streaming ? "none" : "power3.out",
        overwrite: true,
      },
    );
  }, [first]);

  const fade = `linear-gradient(to right, transparent, #000 ${FADE}px, #000 calc(100% - ${FADE}px), transparent)`;

  return (
    <Card title="회차별 잔디밭" subtitle={range}>
      <div className="flex gap-1.5">
        <NumberAxis />
        <div
          ref={measureRef}
          className="relative min-w-0 flex-1 overflow-hidden"
          // 양옆 FADE 만큼 옅게 지운다 — 창 밖으로 나가는 회차가 잘리지 않고 스러지듯 사라진다
          style={{ maskImage: fade }}
        >
          {/* 버퍼 가운데 slack 만큼을 왼쪽 바깥으로 당겨, 창의 첫 열이 흐림 구간 바로 뒤에 서게 한다 */}
          <div ref={stripRef} className="flex w-max gap-px" style={{ marginLeft: -slack }}>
            {before.map((column, i) =>
              column ? <RoundColumn key={column.round} column={column} /> : <EmptyColumn key={`before-${i}`} />,
            )}
            {columns.map((column) => (
              <RoundColumn key={column.round} column={column} />
            ))}
            {after.map((column, i) =>
              column ? <RoundColumn key={column.round} column={column} /> : <EmptyColumn key={`after-${i}`} />,
            )}
          </div>
          {/* 양 끝에 옅은 블러를 겹친다 — 바깥으로 갈수록 흐려진다 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 backdrop-blur-[2px]"
            style={{ width: FADE, maskImage: "linear-gradient(to right, #000, transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 backdrop-blur-[2px]"
            style={{ width: FADE, maskImage: "linear-gradient(to left, #000, transparent)" }}
          />
        </div>
      </div>
      {timeline && (
        <div className="mt-4 pl-7.5">
          <RoundTimeline {...timeline} />
        </div>
      )}
    </Card>
  );
}
