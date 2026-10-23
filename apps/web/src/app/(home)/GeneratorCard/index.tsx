"use client";
import { Ball } from "@ui/Ball";
import { Card } from "@ui/Card";
import { useGeneratorCardPresenter } from "./GeneratorCard.presenter";
import { generatorCard } from "./GeneratorCard.styles";

const s = generatorCard();

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
            className={s.modeButton({ active })}
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
              className={s.numberButton({ selected })}
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

