"use client";
import { ballColor } from "@/shared/lib/lotto-colors";
import { Card } from "@/shared/ui/card";
import type { StatisticsViewModel } from "./model/Statistics.viewmodel";

export interface NumberFrequencyBarsProps {
  bars: StatisticsViewModel["frequencyBars"];
}

export function NumberFrequencyBars({ bars }: NumberFrequencyBarsProps) {
  return (
    <Card
      title="번호별 출현 확률"
      subtitle="전 회차에서 각 번호가 뽑힌 비율"
      footnote="이론상 모든 번호의 기대 확률은 동일합니다 (6/45 ≈ 13.3%). 편차는 우연입니다."
    >
      <div className="flex h-36 items-end gap-[3px]">
        {bars.map(({ number, count, heightPercent, sharePercent }) => (
          <div
            key={number}
            className="group relative flex-1 rounded-t"
            style={{
              height: `${heightPercent}%`,
              backgroundColor: ballColor(number).bg,
              opacity: 0.85,
            }}
            title={`${number}번 · ${count}회 (${sharePercent}%)`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-nano text-muted">
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
