"use client";
// 라우트 = 모듈 조립만 (경계 규칙). 모듈 간 데이터 흐름(현재 조합)을 여기서 중개한다.
import { useState } from "react";
import { CountdownCard } from "@/modules/countdown";
import { LatestDrawCard } from "@/modules/draw";
import { GeneratorCard } from "@/modules/generator";
import { IdentityBadge } from "@/modules/identity";
import { PicksCard } from "@/modules/picks";
import { ResultsCard } from "@/modules/results";
import { SimulationCard } from "@/modules/simulation";
import { StatisticsPanel } from "@/modules/statistics";

export default function HomePage() {
  const [currentNumbers, setCurrentNumbers] = useState<number[] | null>(null);

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            로또랩 <span className="text-emerald-600">Lotto Lab</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            사기 전에, 데이터로 확인하세요. 과거 통계는 미래 당첨 확률을 높이지 않습니다 — 저희는
            그 사실부터 정직하게 보여드립니다.
          </p>
        </div>
        <IdentityBadge />
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LatestDrawCard />
        <CountdownCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <GeneratorCard onGenerated={setCurrentNumbers} />
          <SimulationCard numbers={currentNumbers} />
          <PicksCard currentNumbers={currentNumbers} />
          <ResultsCard />
        </div>
        <StatisticsPanel myNumbers={currentNumbers} />
      </div>
    </main>
  );
}
