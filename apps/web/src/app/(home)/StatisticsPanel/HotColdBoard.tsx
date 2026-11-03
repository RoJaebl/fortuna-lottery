"use client";
import { Ball } from "@ui/Ball";
import { Card } from "@ui/Card";

export interface HotColdBoardProps {
  /** 각 목록의 상위 개수 — 「TOP 8」 */
  top: number;
  /** 오래 안 나온 번호 — gap 큰 순 */
  coldest: { number: number; gapLabel: string }[];
  /** 최근 나온 번호 — gap 작은 순 */
  hottest: { number: number; gapLabel: string }[];
}

function GapRow({ title, items, cold }: { title: string; items: HotColdBoardProps["coldest"]; cold: boolean }) {
  return (
    <div>
      <p className="mb-3 text-pico uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="flex flex-wrap gap-3">
        {items.map(({ number, gapLabel }) => (
          <div key={number} className="flex flex-col items-center gap-1.5">
            {cold ? <Ball n={number} size="md" dimmed /> : <Ball n={number} size="md" glow={0.5} />}
            <span className="text-pico tabular-nums text-muted">{gapLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HotColdBoard({ top, coldest, hottest }: HotColdBoardProps) {
  return (
    <Card
      title="미출현 기간 (핫/콜드)"
      subtitle="각 번호가 몇 회째 안 나왔는지"
      footnote="미출현 기간은 미래 출현 가능성을 높이지 않습니다 (매 회차 독립 사건)."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <GapRow title={`오래 안 나온 번호 TOP ${top}`} items={coldest} cold />
        <GapRow title={`최근 나온 번호 TOP ${top}`} items={hottest} cold={false} />
      </div>
    </Card>
  );
}
