"use client";
import { Card } from "@/shared/ui/card";
import type { StatisticsViewModel } from "../model/Statistics.viewmodel";

const W = 560;
const H = 140;

export interface SumDistributionChartProps {
  /** 합계 분포 — 분포가 비면 null 이고 카드를 그리지 않는다 */
  chart: StatisticsViewModel["sumChart"];
  subtitle: string;
  /** 합계 축 위 내 합계의 자리(x 는 0~1) — 내 조합이 없으면 null */
  marker: { sum: number; x: number } | null;
}

export function SumDistributionChart({ chart, subtitle, marker }: SumDistributionChartProps) {
  if (!chart) return null;

  return (
    <Card title="번호 합계 분포" subtitle={subtitle}>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
        {chart.points.map(({ sum, x, y }) => (
          <rect
            key={sum}
            x={x * W - 1}
            y={H - y * (H - 10)}
            width={2.4}
            height={y * (H - 10)}
            fill="#38bdf8"
            opacity={0.75}
          />
        ))}
        {marker ? (
          <g>
            <line x1={marker.x * W} y1={0} x2={marker.x * W} y2={H} stroke="#f59e0b" strokeWidth={2} />
            <text x={marker.x * W} y={H + 14} textAnchor="middle" fontSize={11} fill="#f59e0b">
              내 합계 {marker.sum}
            </text>
          </g>
        ) : null}
        <text x={0} y={H + 14} fontSize={10} fill="#64748b">
          {chart.minSum}
        </text>
        <text x={W} y={H + 14} textAnchor="end" fontSize={10} fill="#64748b">
          {chart.maxSum}
        </text>
      </svg>
    </Card>
  );
}
