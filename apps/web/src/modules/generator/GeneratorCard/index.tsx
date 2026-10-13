"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useGeneratorCardPresenter } from "./GeneratorCard.presenter";

export interface GeneratorCardProps {
  onGenerated: (numbers: number[]) => void;
}

export function GeneratorCard({ onGenerated }: GeneratorCardProps) {
  const card = useGeneratorCardPresenter(onGenerated);

  return (
    <Card title="번호 만들기" subtitle={card.hint}>
      <div className="mb-4 flex gap-2">
        {card.modeItems.map(({ key, label, active }) => (
          <button
            key={key}
            type="button"
            onClick={() => card.changeMode(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {card.showNumberGrid ? (
        <div className="mb-4 grid grid-cols-9 gap-1.5">
          {card.numberItems.map(({ n, selected }) => (
            <button
              key={n}
              type="button"
              onClick={() => card.toggleNumber(n)}
              className={`rounded-md py-1 text-xs font-semibold tabular-nums transition-colors ${
                selected
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={card.generate}
        disabled={card.generateDisabled}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {card.generateLabel}
      </button>

      {card.error ? <p className="mt-3 text-sm text-red-600">{card.error}</p> : null}

      {card.result ? (
        <div className="mt-4 flex items-center gap-1.5">
          {card.result.map((n) => (
            <Ball key={n} n={n} size="lg" />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
