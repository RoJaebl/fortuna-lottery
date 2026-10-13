"use client";
import { Card } from "@/shared/ui/card";
import type { DistBar } from "../model/Statistics.viewmodel";

/** 분포 막대 하나 — 내 조합이 놓인 막대면 highlighted */
export interface PatternBar extends DistBar {
  highlighted: boolean;
}

export interface PatternDistributionProps {
  /** 내 조합의 홀짝 희귀도 문구 — 내 조합이 없으면 안내 문구 */
  subtitle: string;
  oddBars: PatternBar[];
  lowBars: PatternBar[];
  zoneBars: PatternBar[];
}

function DistBars({ bars }: { bars: PatternBar[] }) {
  return (
    <div className="flex items-end gap-1.5">
      {bars.map(({ label, percent, heightPx, highlighted }) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] tabular-nums text-slate-500">{`${percent}%`}</span>
          <div
            className={`w-full rounded-t ${highlighted ? "bg-amber-600" : "bg-sky-600/70"}`}
            style={{ height: `${heightPx}px` }}
          />
          <span className={`text-[10px] ${highlighted ? "font-bold text-amber-600" : "text-slate-500"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PatternDistribution({ subtitle, oddBars, lowBars, zoneBars }: PatternDistributionProps) {
  return (
    <Card
      title="홀짝 · 고저 · 구간 분포"
      subtitle={subtitle}
      footnote="패턴의 흔함/드묾은 과거 빈도의 서술일 뿐, 당첨 가능성과 무관합니다."
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">홀수 개수 (0~6)</p>
          <DistBars bars={oddBars} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">저구간(1~22) 개수 (0~6)</p>
          <DistBars bars={lowBars} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">구간별 총 출현</p>
          <DistBars bars={zoneBars} />
        </div>
      </div>
    </Card>
  );
}
