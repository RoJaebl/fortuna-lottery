"use client";
import { ballColor } from "@/shared/lib/lotto-colors";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";

export function NumberFrequencyBars({ stats }: { stats: StatisticsModel }) {
  const max = Math.max(...stats.frequency, 1);
  const totalPicks = stats.totalDraws * 6;

  return (
    <Card
      title="번호별 출현 확률"
      subtitle="전 회차에서 각 번호가 뽑힌 비율"
      footnote="이론상 모든 번호의 기대 확률은 동일합니다 (6/45 ≈ 13.3%). 편차는 우연입니다."
    >
      <div className="flex h-36 items-end gap-[3px]">
        {stats.frequency.map((count, i) => (
          <div
            key={i + 1}
            className="group relative flex-1 rounded-t"
            style={{
              height: `${(count / max) * 100}%`,
              backgroundColor: ballColor(i + 1).bg,
              opacity: 0.85,
            }}
            title={`${i + 1}번 · ${count}회 (${totalPicks > 0 ? ((count / totalPicks) * 100).toFixed(2) : 0}%)`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>1</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>45</span>
      </div>
    </Card>
  );
}
