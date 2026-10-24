"use client";
// 페이지 뷰 = 조립만. 자식이 함께 쓰는 상태는 _state/ 의 공통 상태이고, 고른 메뉴와 활성 탭은 Home.presenter 가 쥔다.
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
import { useHomePresenter, type HomeMenuKey, type HomeTabKey } from "./Home.presenter";

const PANELS: Record<HomeTabKey, ReactNode> = {
  statistics: <StatisticsPanel />,
  simulation: <SimulationCard />,
  picks: <PicksCard />,
  results: <ResultsCard />,
  hypothesis: <HypothesisLab />,
};

export default function HomePage() {
  const { menu, tabs } = useHomePresenter();

  const content: Record<HomeMenuKey, ReactNode> = {
    workroom: (
      <>
        <GeneratorCard />
        <div className="mt-8">
          <Tabs {...tabs} />
        </div>
        <div role="tabpanel" className="mt-4">
          {PANELS[tabs.active]}
        </div>
      </>
    ),
  };

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-line bg-panel p-4 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div>
          <h1 className="text-sub font-bold tracking-tight">
            로또랩 <span className="text-accent">Lotto Lab</span>
          </h1>
          <p className="mt-1 text-micro text-muted">
            과거 통계는 미래 당첨 확률을 높이지 않습니다.
          </p>
        </div>

        <nav aria-label="메뉴" className="flex flex-row gap-1 md:flex-col">
          {menu.items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => menu.onChange(item.key)}
              aria-current={item.key === menu.active ? "page" : undefined}
              className="rounded-box px-3 py-2 text-left text-small font-medium text-muted transition-colors hover:text-text aria-[current=page]:bg-selected aria-[current=page]:text-text"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="md:mt-auto">
          <IdentityBadge />
        </div>
      </aside>

      {/* 머리띠는 패널 옆에 서고, 화면보다 길어진 콘텐츠는 이 열 안에서만 스크롤된다 */}
      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <LotterietusCard />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:overflow-y-auto">{content[menu.active]}</main>
      </div>
    </div>
  );
}
