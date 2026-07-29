"use client";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";
import { lowCountOf, oddCountOf, oddEvenRarity } from "../viewmodel/presenters";

function DistBars({
  dist,
  total,
  highlight,
  labelOf,
}: {
  dist: number[];
  total: number;
  highlight: number | null;
  labelOf: (i: number) => string;
}) {
  const max = Math.max(...dist, 1);
  return (
    <div className="flex items-end gap-1.5">
      {dist.map((count, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] tabular-nums text-slate-500">
            {total > 0 ? `${Math.round((count / total) * 100)}%` : "0%"}
          </span>
          <div
            className={`w-full rounded-t ${i === highlight ? "bg-amber-400" : "bg-sky-600/70"}`}
            style={{ height: `${6 + (count / max) * 56}px` }}
          />
          <span className={`text-[10px] ${i === highlight ? "font-bold text-amber-300" : "text-slate-500"}`}>
            {labelOf(i)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PatternDistribution({
  stats,
  myNumbers,
}: {
  stats: StatisticsModel;
  myNumbers: number[] | null;
}) {
  const rarity = myNumbers ? oddEvenRarity(myNumbers, stats) : null;

  return (
    <Card
      title="홀짝 · 고저 · 구간 분포"
      subtitle={
        rarity
          ? `내 조합(${rarity.label})과 같은 홀짝 패턴은 과거 회차의 ${rarity.percent}%였습니다`
          : "내 조합이 과거 패턴과 얼마나 닮았는지 확인하세요"
      }
      footnote="패턴의 흔함/드묾은 과거 빈도의 서술일 뿐, 당첨 가능성과 무관합니다."
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">홀수 개수 (0~6)</p>
          <DistBars
            dist={stats.oddCountDist}
            total={stats.totalDraws}
            highlight={myNumbers ? oddCountOf(myNumbers) : null}
            labelOf={(i) => `홀${i}`}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">저구간(1~22) 개수 (0~6)</p>
          <DistBars
            dist={stats.lowCountDist}
            total={stats.totalDraws}
            highlight={myNumbers ? lowCountOf(myNumbers) : null}
            labelOf={(i) => `저${i}`}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">구간별 총 출현</p>
          <DistBars
            dist={stats.zoneCounts}
            total={stats.zoneCounts.reduce((a, b) => a + b, 0)}
            highlight={null}
            labelOf={(i) => ["1-10", "11-20", "21-30", "31-40", "41-45"][i] ?? ""}
          />
        </div>
      </div>
    </Card>
  );
}
