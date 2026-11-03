"use client";
import { ballColor } from "@lib/lotto-colors";
import { Card } from "@ui/Card";
import type { StatisticsViewModel } from "./_model/Statistics.viewmodel";

export interface NumberFrequencyBarsProps {
  bars: StatisticsViewModel["frequencyBars"];
}

/** 가로축 눈금 — 막대 칸 위치(1~45)에 맞춰 선다 */
const TICKS = [1, 10, 20, 30, 40, 45];

export function NumberFrequencyBars({ bars }: NumberFrequencyBarsProps) {
  return (
    <Card
      title="번호별 출현 확률"
      subtitle="전 회차에서 각 번호가 뽑힌 비율"
      footnote="이론상 모든 번호의 기대 확률은 동일합니다 (6/45 ≈ 13.3%). 편차는 우연입니다."
    >
      <div className="relative flex h-40 items-end gap-[3px] border-b border-line">
        {/* 옅은 점선 보조선 — 위에서부터 ¼ 간격 */}
        {[0.25, 0.5, 0.75].map((y) => (
          <span
            key={y}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/80"
            style={{ bottom: `${y * 100}%` }}
          />
        ))}
        {bars.map(({ number, count, heightPercent, sharePercent }) => (
          <div
            key={number}
            className="relative flex-1 rounded-t-[3px] transition-[height] duration-300"
            style={{
              height: `${heightPercent}%`,
              backgroundColor: ballColor(number).bg,
              opacity: 0.9,
            }}
            title={`${number}번 · ${count}회 (${sharePercent}%)`}
          />
        ))}
      </div>
      <div className="relative mt-1.5 h-3 text-pico tabular-nums text-muted">
        {TICKS.map((n) => (
          <span key={n} className="absolute -translate-x-1/2" style={{ left: `${((n - 0.5) / 45) * 100}%` }}>
            {n}
          </span>
        ))}
      </div>
    </Card>
  );
}
