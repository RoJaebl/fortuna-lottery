"use client";
import { Fragment } from "react";
import { Ball } from "@ui/Ball";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { useResultsCardPresenter } from "./ResultsCard.presenter";
import { resultsCard } from "./ResultsCard.styles";

const s = resultsCard();

export function ResultsCard() {
  const card = useResultsCardPresenter();

  return (
    <Card title="결과 확인" subtitle={card.subtitle}>
      <Button onClick={card.check} disabled={card.checkDisabled}>
        {card.checkLabel}
      </Button>

      {card.error ? <p className="mt-3 text-micro text-danger">{card.error}</p> : null}

      {card.checked ? (
        card.empty ? (
          <p className="mt-5 text-micro text-muted">저장한 번호가 없습니다.</p>
        ) : (
          <div className="mt-5">
            {card.draw ? (
              <div className="flex items-center gap-1.5 rounded-box bg-said px-3 py-2.5">
                <span className="mr-2 text-pico uppercase tracking-[0.18em] text-muted">당첨</span>
                {card.draw.balls.map(({ n, bonus }) => (
                  <Fragment key={n}>
                    {bonus ? <span className="px-0.5 text-nano text-muted">+</span> : null}
                    <Ball n={n} size="sm" />
                  </Fragment>
                ))}
              </div>
            ) : null}
            <ul className="mt-2 divide-y divide-line/70">
              {card.items.map((item) => (
                <li key={item.pickId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-1.5">
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

