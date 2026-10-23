"use client";
import { Ball } from "@ui/ball";
import { Card } from "@ui/card";
import { useGeneratorCardPresenter } from "./GeneratorCard.presenter";

export function GeneratorCard() {
  const card = useGeneratorCardPresenter();

  return (
    <Card title="번호 만들기" subtitle={card.hint}>
      <div className="mb-4 flex gap-2">
        {card.modeItems.map(({ key, label, active }) => (
          <button
            key={key}
            type="button"
            onClick={() => card.changeMode(key)}
            className={`rounded-box px-3 py-2 text-small font-medium transition-colors ${
              active
                ? "bg-accent text-on-strong"
                : "bg-said text-text hover:bg-inset"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {card.showNumberGrid ? (
        <div className="mb-4 grid grid-cols-9 gap-2">
          {card.numberItems.map(({ n, selected }) => (
            <button
              key={n}
              type="button"
              onClick={() => card.toggleNumber(n)}
              className={`rounded-button py-1 text-micro font-semibold tabular-nums transition-colors ${
                selected
                  ? "bg-accent text-on-strong"
                  : "bg-said text-muted hover:bg-inset"
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
        className="rounded-box bg-strong px-5 py-2 text-small font-semibold text-on-strong transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {card.generateLabel}
      </button>

      {card.error ? <p className="mt-3 text-small text-danger">{card.error}</p> : null}

      {card.result ? (
        <div className="mt-4 flex items-center gap-2">
          {card.result.map((n) => (
            <Ball key={n} n={n} size="lg" />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

