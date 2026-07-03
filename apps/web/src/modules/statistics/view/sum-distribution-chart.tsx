"use client";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";
import { sumPosition } from "../viewmodel/presenters";

const W = 560;
const H = 140;

export function SumDistributionChart({
  stats,
  myNumbers,
}: {
  stats: StatisticsModel;
  myNumbers: number[] | null;
}) {
  const dist = stats.sumDistribution;
  if (dist.length === 0) return null;

  const minSum = dist[0]?.sum ?? 21;
  const maxSum = dist[dist.length - 1]?.sum ?? 255;
  const maxCount = Math.max(...dist.map((d) => d.count));
  const x = (sum: number) => ((sum - minSum) / Math.max(1, maxSum - minSum)) * W;
  const y = (count: number) => H - (count / maxCount) * (H - 10);

  const my = myNumbers ? sumPosition(myNumbers, stats) : null;

  return (
    <Card
      title="번호 합계 분포"
      subtitle={
        my
          ? `내 조합 합계 ${my.mySum} — 과거 회차의 ${my.percentBelow}%가 이보다 작았습니다`
          : "전 회차 6개 번호 합계의 분포"
      }
    >
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
        {dist.map(({ sum, count }) => (
          <rect
            key={sum}
            x={x(sum) - 1}
            y={y(count)}
            width={2.4}
            height={H - y(count)}
            fill="#38bdf8"
            opacity={0.75}
          />
        ))}
        {my ? (
          <g>
            <line x1={x(my.mySum)} y1={0} x2={x(my.mySum)} y2={H} stroke="#f59e0b" strokeWidth={2} />
            <text x={x(my.mySum)} y={H + 14} textAnchor="middle" fontSize={11} fill="#f59e0b">
              내 합계 {my.mySum}
            </text>
          </g>
        ) : null}
        <text x={0} y={H + 14} fontSize={10} fill="#64748b">
          {minSum}
        </text>
        <text x={W} y={H + 14} textAnchor="end" fontSize={10} fill="#64748b">
          {maxSum}
        </text>
      </svg>
    </Card>
  );
}
