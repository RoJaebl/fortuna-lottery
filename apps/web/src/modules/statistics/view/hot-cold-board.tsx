"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";
import { coldest, hottest } from "../viewmodel/presenters";

export function HotColdBoard({ stats }: { stats: StatisticsModel }) {
  return (
    <Card
      title="미출현 기간 (핫/콜드)"
      subtitle="각 번호가 몇 회째 안 나왔는지"
      footnote="미출현 기간은 미래 출현 가능성을 높이지 않습니다 (매 회차 독립 사건)."
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">오래 안 나온 번호 TOP 8</p>
          <div className="flex flex-wrap gap-2">
            {coldest(stats, 8).map(({ number, gap }) => (
              <div key={number} className="flex flex-col items-center gap-0.5">
                <Ball n={number} size="sm" dimmed />
                <span className="text-[10px] tabular-nums text-slate-500">{gap}회</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">최근 나온 번호 TOP 8</p>
          <div className="flex flex-wrap gap-2">
            {hottest(stats, 8).map(({ number, gap }) => (
              <div key={number} className="flex flex-col items-center gap-0.5">
                <Ball n={number} size="sm" glow={0.7} />
                <span className="text-[10px] tabular-nums text-slate-500">
                  {gap === 0 ? "최신" : `${gap}회`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
