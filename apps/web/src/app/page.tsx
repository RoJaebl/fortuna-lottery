"use client";
// 셸 = 조립과 입력 묶음 전개만. 모듈 간 공유 상태는 Home.presenter 가 쥔다.
import type { ReactNode } from "react";
import { GeneratorCard } from "@/modules/generator";
import { IdentityBadge } from "@/modules/identity";
import { LotterietusCard } from "@/modules/lotterietus";
import { PicksCard } from "@/modules/picks";
import { ResultsCard } from "@/modules/results";
import { SimulationCard } from "@/modules/simulation";
import { StatisticsPanel } from "@/modules/statistics";
import { Tabs } from "@/shared/ui/tabs";
import { useHomePresenter, type HomeTabKey } from "./Home.presenter";

export default function HomePage() {
  const { isGeneratorOpen, lotterietus, generator, tabs, statistics, simulation, picks } =
    useHomePresenter();

  const panels: Record<HomeTabKey, ReactNode> = {
    statistics: <StatisticsPanel {...statistics} />,
    simulation: <SimulationCard {...simulation} />,
    picks: <PicksCard {...picks} />,
    results: <ResultsCard />,
  };

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <LotterietusCard {...lotterietus} />

      {isGeneratorOpen ? (
        <div className="mt-4">
          <GeneratorCard {...generator} />
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs {...tabs} />
      </div>

      <div role="tabpanel" className="mt-4">
        {panels[tabs.active]}
      </div>
    </main>
  );
}
