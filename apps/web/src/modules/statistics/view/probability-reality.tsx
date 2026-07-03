"use client";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";
import { probabilityFacts } from "../viewmodel/presenters";

export function ProbabilityReality({ stats }: { stats: StatisticsModel }) {
  const facts = probabilityFacts(stats.totalCombinations);

  return (
    <Card
      title="당첨 확률, 있는 그대로"
      subtitle="이 서비스의 어떤 통계도 이 확률을 바꾸지 못합니다"
    >
      <p className="mb-3 text-3xl font-bold tracking-tight text-slate-100">
        1 <span className="text-slate-500">/</span> {stats.totalCombinations.toLocaleString()}
      </p>
      <ul className="space-y-1.5">
        {facts.map((fact) => (
          <li key={fact} className="text-sm leading-relaxed text-slate-400">
            · {fact}
          </li>
        ))}
      </ul>
    </Card>
  );
}
