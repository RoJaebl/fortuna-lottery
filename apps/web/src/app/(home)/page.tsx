"use client";
// 페이지 뷰 = 조립만. 자식이 함께 쓰는 상태는 _state/ 의 공통 상태이고, 활성 탭은 Home.presenter 가 쥔다.
import type { ReactNode } from "react";
import { GeneratorCard } from "./GeneratorCard";
import { HypothesisLab } from "./HypothesisLab";
import { IdentityBadge } from "./IdentityBadge";
import { LotterietusCard } from "./LotterietusCard";
import { PicksCard } from "./PicksCard";
import { ResultsCard } from "./ResultsCard";
import { SimulationCard } from "./SimulationCard";
import { StatisticsPanel } from "./StatisticsPanel";
import { Tabs } from "@ui/Tabs";
import { useHomePresenter, type HomeTabKey } from "./Home.presenter";

const PANELS: Record<HomeTabKey, ReactNode> = {
  statistics: <StatisticsPanel />,
  simulation: <SimulationCard />,
  picks: <PicksCard />,
  results: <ResultsCard />,
  hypothesis: <HypothesisLab />,
};

export default function HomePage() {
  const { isGeneratorOpen, tabs } = useHomePresenter();

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-head font-bold tracking-tight">
            로또랩 <span className="text-accent">Lotto Lab</span>
          </h1>
          <p className="mt-1 text-small text-muted">
            사기 전에, 데이터로 확인하세요. 과거 통계는 미래 당첨 확률을 높이지 않습니다 — 저희는
            그 사실부터 정직하게 보여드립니다.
          </p>
        </div>
        <IdentityBadge />
      </header>

      <LotterietusCard />

      {isGeneratorOpen ? (
        <div className="mt-4">
          <GeneratorCard />
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs {...tabs} />
      </div>

      <div role="tabpanel" className="mt-4">
        {PANELS[tabs.active]}
      </div>
    </main>
  );
}
