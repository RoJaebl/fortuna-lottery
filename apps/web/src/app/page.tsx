"use client";
// 라우트 = 모듈 조립만 (경계 규칙). 모듈 간 데이터 흐름(현재 조합)과 화면 전환 상태를 여기서 중개한다.
import { useState } from "react";
import { GeneratorCard } from "@/modules/generator";
import { IdentityBadge } from "@/modules/identity";
import { LotterietusCard } from "@/modules/lotterietus";
import { PicksCard } from "@/modules/picks";
import { ResultsCard } from "@/modules/results";
import { SimulationCard } from "@/modules/simulation";
import { StatisticsPanel } from "@/modules/statistics";
import { Tabs, type TabItem } from "@/shared/ui/tabs";

type TabKey = "statistics" | "simulation" | "picks" | "results";

/** 각 카드의 기존 title을 탭 라벨로 그대로 사용 (설계 문서 §3) */
const TABS: readonly TabItem<TabKey>[] = [
  { key: "statistics", label: "통계" },
  { key: "simulation", label: "시뮬레이션" },
  { key: "picks", label: "내 번호" },
  { key: "results", label: "결과 확인" },
];

export default function HomePage() {
  const [currentNumbers, setCurrentNumbers] = useState<number[] | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("statistics");

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

      <LotterietusCard
        generatorOpen={isGeneratorOpen}
        onToggleGenerator={() => setIsGeneratorOpen((open) => !open)}
      />

      {isGeneratorOpen ? (
        <div className="mt-4">
          <GeneratorCard onGenerated={setCurrentNumbers} />
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs items={TABS} active={activeTab} onChange={setActiveTab} label="주요 화면" />
      </div>

      <div role="tabpanel" className="mt-4">
        {activeTab === "statistics" ? <StatisticsPanel myNumbers={currentNumbers} /> : null}
        {activeTab === "simulation" ? <SimulationCard numbers={currentNumbers} /> : null}
        {activeTab === "picks" ? <PicksCard currentNumbers={currentNumbers} /> : null}
        {activeTab === "results" ? <ResultsCard /> : null}
      </div>
    </main>
  );
}
