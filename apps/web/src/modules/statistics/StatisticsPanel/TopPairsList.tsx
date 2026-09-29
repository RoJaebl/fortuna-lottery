"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import type { StatisticsViewModel } from "../model/Statistics.viewmodel";

export interface TopPairsListProps {
  stats: StatisticsViewModel;
}

export function TopPairsList({ stats }: TopPairsListProps) {
  const maxCount = stats.topPairs[0]?.count ?? 1;

  return (
    <Card title="동시 출현 페어 TOP 15" subtitle="함께 자주 나온 번호쌍">
      <ul className="space-y-1.5">
        {stats.topPairs.map(({ a, b, count }) => (
          <li key={`${a}-${b}`} className="flex items-center gap-2">
            <Ball n={a} size="sm" />
            <Ball n={b} size="sm" />
            <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
              <div
                className="h-full rounded bg-sky-600"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-slate-500">{count}회</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
