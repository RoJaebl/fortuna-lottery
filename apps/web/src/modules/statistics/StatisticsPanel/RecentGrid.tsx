"use client";
import { ballColor } from "@/shared/lib/lotto-colors";
import { Card } from "@/shared/ui/card";
import type { StatisticsViewModel } from "./model/Statistics.viewmodel";

export interface RecentGridProps {
  /** 회차 범위 문구 — 회차가 없으면 빈 문자열 */
  range: string;
  columns: StatisticsViewModel["recentColumns"];
}

/** 잔디밭 — 가로 회차 / 세로 1~45, 출현 번호 칸을 공 색으로 칠한다 */
export function RecentGrid({ range, columns }: RecentGridProps) {
  return (
    <Card title="회차별 잔디밭" subtitle={range}>
      <div className="overflow-x-auto [scrollbar-gutter:stable]">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, 9px)`,
            gridTemplateRows: "repeat(45, 9px)",
            gridAutoFlow: "column",
          }}
        >
          {columns.map(({ round, cells }) =>
            cells.map(({ n, present, title }) => (
              <div
                key={`${round}-${n}`}
                title={title}
                className="rounded-none"
                style={{
                  backgroundColor: present ? ballColor(n).bg : "var(--ui-line)",
                }}
              />
            )),
          )}
        </div>
      </div>
    </Card>
  );
}
