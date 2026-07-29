"use client";
import { ballColor } from "@/shared/lib/lotto-colors";
import { Card } from "@/shared/ui/card";
import type { StatisticsModel } from "../model/statistics.model";

/** 잔디밭 — 가로 회차 / 세로 1~45, 출현 번호 칸을 공 색으로 칠한다 */
export function RecentGrid({ stats }: { stats: StatisticsModel }) {
  const rounds = stats.recentGrid;
  const first = rounds[0]?.round;
  const last = rounds[rounds.length - 1]?.round;

  return (
    <Card
      title="회차별 잔디밭"
      subtitle={first && last ? `제${first}회 ~ 제${last}회 (최근 ${rounds.length}회차)` : undefined}
    >
      <div className="overflow-x-auto">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${rounds.length}, 9px)`,
            gridTemplateRows: "repeat(45, 9px)",
            gridAutoFlow: "column",
          }}
        >
          {rounds.map((r) => {
            const present = new Set(r.numbers);
            return Array.from({ length: 45 }, (_, i) => {
              const n = i + 1;
              return (
                <div
                  key={`${r.round}-${n}`}
                  title={`제${r.round}회 · ${n}번${present.has(n) ? " 출현" : ""}`}
                  className="rounded-[1px]"
                  style={{
                    backgroundColor: present.has(n) ? ballColor(n).bg : "#e2e8f0",
                  }}
                />
              );
            });
          })}
        </div>
      </div>
    </Card>
  );
}
