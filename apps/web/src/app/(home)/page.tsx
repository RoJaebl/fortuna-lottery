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
  hypothesis: <HypothesisLab />,
};

export default function HomePage() {
  const { menu, tabs } = useHomePresenter();

  const content: Record<HomeMenuKey, ReactNode> = {
    workroom: (
      <>
        {/* 번호 영역 — 만들고, 저장하고, 대조하는 일을 한자리에 늘 펼쳐 둔다. 넓은 화면은 왼쪽 만들기 · 오른쪽 내 번호와 결과 */}
        <section aria-label="번호" className="grid items-start gap-5 lg:grid-cols-2">
          <GeneratorCard />
          <div className="grid gap-5">
            <PicksCard />
            <ResultsCard />
          </div>
        </section>
        <div className="mt-12">
          <Tabs {...tabs} />
        </div>
        <div role="tabpanel" className="mt-6">
          {PANELS[tabs.active]}
        </div>
      </>
    ),
  };

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <aside className="flex flex-col gap-8 border-b border-line/80 bg-panel px-5 py-6 md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div>
          <p className="text-pico font-semibold uppercase tracking-[0.24em] text-muted">Lotto Lab</p>
          <h1 className="mt-1.5 text-sub font-semibold tracking-tight text-text">로또랩</h1>
          <p className="mt-3 text-nano leading-relaxed text-muted">
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
              className="rounded-box px-3 py-2 text-left text-small tracking-tight text-muted transition-colors duration-200 hover:text-text aria-[current=page]:bg-selected aria-[current=page]:font-semibold aria-[current=page]:text-text"
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
        <main className="min-w-0 flex-1 md:overflow-y-auto">
          {/* 콘텐츠 폭을 묶어 넓은 화면에서도 글줄과 카드가 늘어지지 않게 한다 */}
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{content[menu.active]}</div>
        </main>
      </div>
    </div>
  );
}
