"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useLotterietusViewModel } from "../viewmodel/use-lotterietus.viewmodel";

export function LotterietusCard() {
  const { data, error, remaining, formatDrawDate } = useLotterietusViewModel();

  return (
    <Card title="로또 현황">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {data ? (
        <>
          <div>
            <p className="text-xs text-slate-500">
              최근 회차 · 제{data.round}회 · {formatDrawDate(data.drawnAt)} 추첨
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              {data.numbers.map((n) => (
                <Ball key={n} n={n} size="lg" />
              ))}
              <span className="mx-1 text-slate-400">+</span>
              <Ball n={data.bonus} size="md" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400">
              다음 추첨까지 · 제{data.nextRound}회 · 매주 토요일 20:35
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums text-slate-500">
              {remaining ?? "…"}
            </p>
          </div>
        </>
      ) : !error ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : null}
    </Card>
  );
}
