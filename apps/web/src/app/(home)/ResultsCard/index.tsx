"use client";
import { Fragment } from "react";
import { Ball } from "@ui/Ball";
import { Card } from "@ui/Card";
import { useResultsCardPresenter } from "./ResultsCard.presenter";
import { resultsCard } from "./ResultsCard.styles";

const s = resultsCard();

export function ResultsCard() {
  const card = useResultsCardPresenter();

  return (
    <Card title="결과 확인" subtitle={card.subtitle}>
      <button
        type="button"
        onClick={card.check}
        disabled={card.checkDisabled}
        className="rounded-box bg-strong px-4 py-2 text-small font-semibold text-on-strong transition-colors hover:opacity-90 disabled:opacity-40"
      >
        {card.checkLabel}
      </button>

      {card.error ? <p className="mt-3 text-small text-danger">{card.error}</p> : null}

      {card.checked ? (
        card.empty ? (
          <p className="mt-4 text-small text-muted">저장한 번호가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {card.draw ? (
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <span className="mr-1 text-micro text-muted">당첨</span>
                {card.draw.balls.map(({ n, bonus }) => (
                  <Fragment key={n}>
                    {bonus ? <span className="text-muted">+</span> : null}
                    <Ball n={n} size="sm" />
                  </Fragment>
                ))}
              </div>
            ) : null}
            <ul className="space-y-3">
              {card.items.map((item) => (
                <li key={item.pickId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {item.balls.map(({ n, matched }) => (
                      <Ball key={n} n={n} size="sm" ring={matched} dimmed={!matched} />
                    ))}
                  </div>
                  <span className={s.resultLabel({ win: item.isWin })}>
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

