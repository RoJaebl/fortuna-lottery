"use client";
import { Ball } from "@ui/Ball";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { useGeneratorCardPresenter } from "./GeneratorCard.presenter";
import { generatorCard } from "./GeneratorCard.styles";

const s = generatorCard();

export function GeneratorCard() {
  const card = useGeneratorCardPresenter();

  return (
    <Card title="번호 만들기" subtitle={card.hint}>
      {/* 모드 — 한 줄 알약 안에서 고른다 */}
      <div role="group" aria-label="생성 방식" className={s.modes()}>
        {card.modeItems.map(({ key, label, active }) => (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => card.changeMode(key)}
            className={s.modeButton({ active })}
          >
            {label}
          </button>
        ))}
      </div>

      {card.showNumberGrid ? (
        <div className="mt-5 grid grid-cols-9 gap-1.5">
          {card.numberItems.map(({ n, selected }) => (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              onClick={() => card.toggleNumber(n)}
              className={s.numberButton({ selected })}
            >
              {n}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button onClick={card.generate} disabled={card.generateDisabled}>
          {card.generateLabel}
        </Button>
        {card.result ? (
          <div className="flex items-center gap-2">
            {card.result.map((n) => (
              <Ball key={n} n={n} size="lg" />
            ))}
          </div>
        ) : null}
      </div>

      {card.error ? <p className="mt-3 text-micro text-danger">{card.error}</p> : null}
    </Card>
  );
}

