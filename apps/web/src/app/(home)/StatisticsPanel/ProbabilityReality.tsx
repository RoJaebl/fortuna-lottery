"use client";
import { Card } from "@ui/Card";
import type { StatisticsViewModel } from "./_model/Statistics.viewmodel";

export interface ProbabilityRealityProps {
  stats: StatisticsViewModel;
}

export function ProbabilityReality({ stats }: ProbabilityRealityProps) {
  const facts = stats.probabilityFacts;

  return (
    <Card
      title="당첨 확률, 있는 그대로"
      subtitle="이 서비스의 어떤 통계도 이 확률을 바꾸지 못합니다"
    >
      <p className="mb-3 text-display font-bold tracking-tight text-text">
        1 <span className="text-muted">/</span> {stats.totalCombinations.toLocaleString()}
      </p>
      <ul className="space-y-2">
        {facts.map((fact) => (
          <li key={fact} className="text-small leading-relaxed text-muted">
            · {fact}
          </li>
        ))}
      </ul>
    </Card>
  );
}
