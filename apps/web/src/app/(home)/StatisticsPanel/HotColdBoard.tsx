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

export function HotColdBoard({ top, coldest, hottest }: HotColdBoardProps) {
  return (
    <Card
      title="미출현 기간 (핫/콜드)"
      subtitle="각 번호가 몇 회째 안 나왔는지"
      footnote="미출현 기간은 미래 출현 가능성을 높이지 않습니다 (매 회차 독립 사건)."
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-micro font-medium text-muted">{`오래 안 나온 번호 TOP ${top}`}</p>
          <div className="flex flex-wrap gap-2">
            {coldest.map(({ number, gapLabel }) => (
              <div key={number} className="flex flex-col items-center gap-1">
                <Ball n={number} size="sm" dimmed />
                <span className="text-nano tabular-nums text-muted">{gapLabel}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-micro font-medium text-muted">{`최근 나온 번호 TOP ${top}`}</p>
          <div className="flex flex-wrap gap-2">
            {hottest.map(({ number, gapLabel }) => (
              <div key={number} className="flex flex-col items-center gap-1">
                <Ball n={number} size="sm" glow={0.7} />
                <span className="text-nano tabular-nums text-muted">{gapLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
