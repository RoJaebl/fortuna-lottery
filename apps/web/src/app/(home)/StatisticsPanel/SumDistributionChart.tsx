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
      <svg viewBox={`${-AXIS} 0 ${W + AXIS} ${H + 20}`} className="w-full">
        {/* 세로축 — 출현 횟수 눈금과 가로 보조선 */}
        {chart.yTicks.map(({ count, y }, i) => (
          <g key={count}>
            <line x1={0} y1={barTop(y)} x2={W} y2={barTop(y)} stroke="var(--ui-line)" strokeWidth={1} />
            <text x={-6} y={barTop(y) + 3.5} textAnchor="end" fontSize={10} fill="var(--ui-muted)">
              {/* 맨 위 눈금에만 단위를 붙인다 */}
              {i === chart.yTicks.length - 1 ? `${count}회` : count}
            </text>
          </g>
        ))}
        {chart.points.map(({ sum, count, x, y }) => (
          <rect
            key={sum}
            x={x * W - 1}
            y={barTop(y)}
            width={2.4}
            height={H - barTop(y)}
            rx={0.8}
            fill="var(--ui-accent)"
            opacity={0.75}
          >
            <title>{`합계 ${sum} · ${count}회`}</title>
          </rect>
        ))}
        {marker ? (
          <g>
            <line x1={marker.x * W} y1={0} x2={marker.x * W} y2={H} stroke="var(--ui-warn)" strokeWidth={2} />
            <text x={marker.x * W} y={H + 14} textAnchor="middle" fontSize={11} fill="var(--ui-warn)">
              내 합계 {marker.sum}
            </text>
          </g>
        ) : null}
        <text x={0} y={H + 14} fontSize={10} fill="var(--ui-muted)">
          {chart.minSum}
        </text>
        <text x={W} y={H + 14} textAnchor="end" fontSize={10} fill="var(--ui-muted)">
          {chart.maxSum}
        </text>
      </svg>
      {timeline && (
        <div className="mt-4">
          <RoundTimeline {...timeline} />
        </div>
      )}
      <table className="mt-4 w-full text-small tabular-nums text-text">
        <thead>
          <tr className="text-micro text-muted">
            <th className="text-left font-medium">합계 구간</th>
            <th className="text-right font-medium">회차 수</th>
            <th className="text-right font-medium">비율</th>
          </tr>
        </thead>
        <tbody>
          {bands.map(({ label, count, percent, mine }) => (
            <tr key={label} className="border-t border-line">
              <td className="py-1">
                {label}
                {mine ? <span className="ml-2 text-micro text-warn">내 합계</span> : null}
              </td>
              <td className="py-1 text-right">{count.toLocaleString()}</td>
              <td className="py-1 text-right">{percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
