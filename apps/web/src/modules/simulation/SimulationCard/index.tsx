"use client";
import { Card } from "@/shared/ui/card";
import { useSimulationCardPresenter } from "./SimulationCard.presenter";

interface SimulationCardProps {
  numbers: number[] | null;
}

export function SimulationCard({ numbers }: SimulationCardProps) {
  const card = useSimulationCardPresenter(numbers);

  return (
    <Card
      title="타임머신 시뮬레이션"
      subtitle="이 번호를 과거 전 회차에 넣었다면?"
      footnote="과거 결과는 사실이지만, 다음 회차의 당첨 확률은 언제나 동일합니다 (미래 예측 아님)."
    >
      <button
        type="button"
        onClick={card.run}
        disabled={card.runDisabled}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {card.runLabel}
      </button>

      {card.error ? <p className="mt-3 text-sm text-red-600">{card.error}</p> : null}

      {card.result ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700">{card.result.summaryLine}</p>
          {card.result.summarizeRanks.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {card.result.summarizeRanks.map(({ rank, label, count }) => (
                <li
                  key={rank}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    rank <= 2
                      ? "border border-amber-200 bg-amber-50 text-amber-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {label} × {count.toLocaleString()}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
