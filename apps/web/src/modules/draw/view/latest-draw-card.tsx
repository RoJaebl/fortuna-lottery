"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useLatestDrawViewModel } from "../viewmodel/use-latest-draw.viewmodel";

export function LatestDrawCard() {
  const { draw, error, formatDrawDate } = useLatestDrawViewModel();

  return (
    <Card title="최근 회차" subtitle={draw ? `제${draw.round}회 · ${formatDrawDate(draw.drawnAt)} 추첨` : undefined}>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {draw ? (
        <div className="flex items-center gap-1.5">
          {draw.numbers.map((n) => (
            <Ball key={n} n={n} />
          ))}
          <span className="mx-1 text-slate-500">+</span>
          <Ball n={draw.bonus} size="sm" />
        </div>
      ) : !error ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : null}
    </Card>
  );
}
