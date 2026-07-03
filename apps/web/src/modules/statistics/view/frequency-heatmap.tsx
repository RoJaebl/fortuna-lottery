"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";
import { glowIntensity } from "../viewmodel/presenters";

export function FrequencyHeatmap({ stats }: { stats: StatisticsModel }) {
  const min = Math.min(...stats.frequency);
  const max = Math.max(...stats.frequency);

  return (
    <Card
      title="출현 빈도 히트맵"
      subtitle={`전 ${stats.totalDraws.toLocaleString()}회차 · 글로우가 강할수록 많이 나온 번호`}
      footnote="과거 출현 빈도입니다. 각 번호가 다음 회차에 나올 확률은 모두 동일합니다."
    >
      <div className="grid grid-cols-9 justify-items-center gap-2.5">
        {stats.frequency.map((count, i) => (
          <div key={i + 1} className="flex flex-col items-center gap-0.5">
            <Ball n={i + 1} size="sm" glow={glowIntensity(count, min, max)} />
            <span className="text-[10px] tabular-nums text-slate-500">{count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
