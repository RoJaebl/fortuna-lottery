"use client";
import { Ball } from "@ui/Ball";
import { Card } from "@ui/Card";
import type { StatisticsViewModel } from "./_model/Statistics.viewmodel";

export interface TopPairsListProps {
  /** 제목의 상위 개수 */
  top: number;
  bars: StatisticsViewModel["topPairBars"];
}

export function TopPairsList({ top, bars }: TopPairsListProps) {
  return (
    <Card title={`동시 출현 페어 TOP ${top}`} subtitle="함께 자주 나온 번호쌍">
      <ul className="divide-y divide-line/60">
        {bars.map(({ pair: [a, b], count, widthPercent }, i) => (
          <li key={`${a}-${b}`} className="flex items-center gap-3 py-2">
            <span className="w-4 text-right text-pico tabular-nums text-muted">{i + 1}</span>
            <div className="flex gap-1">
              <Ball n={a} size="sm" />
              <Ball n={b} size="sm" />
            </div>
            <div className="h-1 flex-1 overflow-hidden rounded-pill bg-said">
              <div className="h-full rounded-pill bg-accent/80" style={{ width: `${widthPercent}%` }} />
            </div>
            <span className="w-10 text-right text-nano tabular-nums text-muted">{count}회</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
