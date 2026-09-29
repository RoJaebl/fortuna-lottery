"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useResultsCardPresenter } from "./ResultsCard.presenter";

export function ResultsCard() {
  const card = useResultsCardPresenter();

  return (
    <Card title="결과 확인" subtitle={card.subtitle}>
      <button
        type="button"
        onClick={card.check}
        disabled={card.checkDisabled}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600 disabled:opacity-40"
      >
        {card.checkLabel}
      </button>

      {card.error ? <p className="mt-3 text-sm text-red-600">{card.error}</p> : null}

      {card.checked ? (
        card.empty ? (
          <p className="mt-4 text-sm text-slate-500">저장한 번호가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {card.draw ? (
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
                <span className="mr-1 text-xs text-slate-500">당첨</span>
                {card.draw.numbers.map((n) => (
                  <Ball key={n} n={n} size="sm" />
                ))}
                <span className="text-slate-500">+</span>
                <Ball n={card.draw.bonus} size="sm" />
              </div>
            ) : null}
            <ul className="space-y-2.5">
              {card.items.map((item) => (
                <li key={item.pickId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {item.balls.map(({ n, matched }) => (
                      <Ball key={n} n={n} size="sm" ring={matched} dimmed={!matched} />
                    ))}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      item.isWin ? "text-amber-600" : "text-slate-500"
                    }`}
                  >
                    {item.resultLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </Card>
  );
}
