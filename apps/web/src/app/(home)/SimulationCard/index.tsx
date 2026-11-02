"use client";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { useSimulationCardPresenter } from "./SimulationCard.presenter";
import { simulationCard } from "./SimulationCard.styles";

const s = simulationCard();

export function SimulationCard() {
  const card = useSimulationCardPresenter();

  return (
    <Card
      title="타임머신 시뮬레이션"
      subtitle="이 번호를 과거 전 회차에 넣었다면?"
      footnote="과거 결과는 사실이지만, 다음 회차의 당첨 확률은 언제나 동일합니다 (미래 예측 아님)."
    >
      <Button onClick={card.run} disabled={card.runDisabled}>
        {card.runLabel}
      </Button>

      {card.error ? <p className="mt-3 text-micro text-danger">{card.error}</p> : null}

      {card.result ? (
        <div className="mt-6 space-y-4">
          <p className="text-small leading-relaxed text-text">{card.result.summaryLine}</p>
          {card.result.rankRows.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {card.result.rankRows.map(({ rank, label, count, emphasized }) => (
                <li
                  key={rank}
                  className={s.rankChip({ emphasized })}
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

