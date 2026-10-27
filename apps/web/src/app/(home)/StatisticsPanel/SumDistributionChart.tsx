"use client";
import { Card } from "@ui/Card";
import { Tabs, type TabsProps } from "@ui/Tabs";
import type { StatisticsViewModel } from "./_model/Statistics.viewmodel";
import type { SumAxisMode } from "./StatisticsPanel.presenter";
import { RoundTimeline, type RoundTimelineProps } from "./RoundTimeline";

const W = 560;
const H = 140;
/** 세로축 숫자가 서는 왼쪽 여백 */
const AXIS = 36;
/** 축 숫자 크기 — viewBox 가 화면 폭과 거의 1:1 로 그려지므로 text-pico(9px)와 같다 */
const TICK_FONT = 9;

/** 막대·눈금·표지가 값이 바뀔 때 끊기지 않고 이어서 움직이게 하는 전환 — 재생 중에는 다음 값으로 다시 겨눈다 */
const SMOOTH = { transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)" } as const;

/** 0~1 높이 비율 → 막대 윗변의 y — 맨 위 10 은 남긴다 */
const barTop = (y: number) => H - y * (H - 10);

export interface SumDistributionChartProps {
  /** 합계 분포 — 분포가 비면 null 이고 카드를 그리지 않는다 */
  chart: StatisticsViewModel["sumChart"];
  subtitle: string;
  /** 합계 축 위 내 합계의 자리(x 는 0~1) — 내 조합이 없으면 null */
  marker: { sum: number; x: number } | null;
  /** 합계 축의 길이 고르기 — 상대 길이(쌓은 회차의 최소~최대) · 절대 길이(21~255) */
  axis: Pick<TabsProps<SumAxisMode>, "items" | "active" | "onChange">;
  /** 차트 아래 표 — 합계 20 단위 구간별 회차 수와 비율. mine 은 내 합계가 든 구간 */
  bands: { label: string; count: number; percent: number; mine: boolean }[];
  /** 재생 바 — 1회부터 고른 회차까지 쌓은 분포를 보인다. 회차가 하나뿐이면 null 이고 그리지 않는다 */
  timeline: RoundTimelineProps | null;
}

export function SumDistributionChart({ chart, subtitle, marker, axis, bands, timeline }: SumDistributionChartProps) {
  if (!chart) return null;

  return (
    <Card title="번호 합계 분포" subtitle={subtitle}>
      <div className="mb-3">
        <Tabs {...axis} variant="chip" label="합계 축 길이" />
      </div>
      <svg viewBox={`${-AXIS} 0 ${W + AXIS} ${H + 20}`} className="w-full tabular-nums">
        {/* 세로축 — 출현 횟수 눈금과 옅은 점선 보조선 */}
        {chart.yTicks.map(({ count, y }, i) => (
          <g key={count} style={{ ...SMOOTH, transform: `translateY(${barTop(y)}px)` }}>
            <line
              x1={0}
              y1={0}
              x2={W}
              y2={0}
              stroke="var(--ui-line)"
              strokeWidth={count === 0 ? 1 : 0.75}
              strokeDasharray={count === 0 ? undefined : "2 3"}
            />
            <text x={-6} y={3} textAnchor="end" fontSize={TICK_FONT} fill="var(--ui-muted)">
              {/* 맨 위 눈금에만 단위를 붙인다 */}
              {i === chart.yTicks.length - 1 ? `${count}회` : count}
            </text>
          </g>
        ))}
        {/* 막대는 전체 높이로 그려 두고 transform 으로 늘이고 옮긴다 — 값이 바뀌면 길이와 자리가 이어서 움직인다 */}
        {chart.points.map(({ sum, count, x, y }) => (
          <rect
            key={sum}
            x={-1}
            y={barTop(1)}
            width={2.4}
            height={H - barTop(1)}
            rx={0.8}
            fill="var(--ui-accent)"
            opacity={0.85}
            style={{ ...SMOOTH, transformOrigin: `0 ${H}px`, transform: `translateX(${x * W}px) scaleY(${y})` }}
          >
            <title>{`합계 ${sum} · ${count}회`}</title>
          </rect>
        ))}
        {/* 가로축 — 양 끝 합계와 그 사이 20 배수 눈금 */}
        {chart.xTicks.map(({ sum, x }) => (
          <g key={sum} style={{ ...SMOOTH, transform: `translateX(${x * W}px)` }}>
            <line x1={0} y1={H} x2={0} y2={H + 3} stroke="var(--ui-line)" strokeWidth={0.75} />
            <text x={0} y={H + 12} textAnchor="middle" fontSize={TICK_FONT} fill="var(--ui-muted)">
              {sum}
            </text>
          </g>
        ))}
        <text x={0} y={H + 12} fontSize={TICK_FONT} fill="var(--ui-muted)">
          {chart.minSum}
        </text>
        <text x={W} y={H + 12} textAnchor="end" fontSize={TICK_FONT} fill="var(--ui-muted)">
          {chart.maxSum}
        </text>
        {/* 내 합계 — 가는 선만 긋고 이름은 아래 범례가 말한다(가로축 숫자와 겹치지 않게) */}
        {marker ? (
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={H}
            stroke="var(--ui-warn)"
            strokeWidth={1.25}
            style={{ ...SMOOTH, transform: `translateX(${marker.x * W}px)` }}
          />
        ) : null}
      </svg>
      {marker ? (
        <p className="mt-1 flex items-center justify-end gap-1.5 text-pico tabular-nums text-warn">
          <span className="h-2.5 w-px bg-warn" />내 합계 {marker.sum}
        </p>
      ) : null}
      {timeline && (
        <div className="mt-4">
          <RoundTimeline {...timeline} />
        </div>
      )}
      <table className="mt-5 w-full text-micro tabular-nums text-text">
        <thead>
          <tr className="text-nano tracking-wide text-muted">
            <th className="pb-1.5 text-left font-medium">합계 구간</th>
            <th className="pb-1.5 text-right font-medium">회차 수</th>
            <th className="pb-1.5 text-right font-medium">비율</th>
          </tr>
        </thead>
        <tbody>
          {bands.map(({ label, count, percent, mine }) => (
            <tr key={label} className="border-t border-line/70">
              <td className="py-1.5">
                {label}
                {mine ? <span className="ml-2 text-nano text-warn">내 합계</span> : null}
              </td>
              <td className="py-1.5 text-right">{count.toLocaleString()}</td>
              <td className="py-1.5 text-right text-muted">{percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
