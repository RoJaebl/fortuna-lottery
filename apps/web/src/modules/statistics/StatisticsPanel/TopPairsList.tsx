"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import type { StatisticsViewModel } from "./model/Statistics.viewmodel";

export interface TopPairsListProps {
  /** 제목의 상위 개수 */
  top: number;
  bars: StatisticsViewModel["topPairBars"];
}

export function TopPairsList({ top, bars }: TopPairsListProps) {
  return (
    <Card title={`동시 출현 페어 TOP ${top}`} subtitle="함께 자주 나온 번호쌍">
      <ul className="space-y-2">
        {bars.map(({ pair: [a, b], count, widthPercent }) => (
          <li key={`${a}-${b}`} className="flex items-center gap-2">
            <Ball n={a} size="sm" />
            <Ball n={b} size="sm" />
            <div className="h-2 flex-1 overflow-hidden rounded bg-said">
              <div className="h-full rounded bg-info" style={{ width: `${widthPercent}%` }} />
            </div>
            <span className="w-10 text-right text-micro tabular-nums text-muted">{count}회</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
