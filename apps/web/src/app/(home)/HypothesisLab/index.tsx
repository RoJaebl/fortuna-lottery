"use client";
import { Ball } from "@ui/Ball";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { useHypothesisLabPresenter } from "./HypothesisLab.presenter";

export function HypothesisLab() {
  const lab = useHypothesisLabPresenter();
  const { controls } = lab;
  const { numbers } = lab.popularity;
  const result = lab.result;

  return (
    <Card
      title="가정 실험실"
      subtitle="가정을 걸면 확률이 어떻게 보이는지, 그 가정이 과거에 얼마나 맞았는지 함께 봅니다."
      footnote="가정 확률은 가정이 참일 때만 성립합니다. 어떤 가정을 걸어도 실제 당첨 확률은 1/8,145,060 입니다."
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-micro text-text">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={controls.excludePastWinners.checked}
            onChange={controls.excludePastWinners.onToggle}
            className="size-3.5 accent-accent"
          />
          과거 1등 조합 제외
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={controls.topK.checked} onChange={controls.topK.onToggle} className="size-3.5 accent-accent" />
          출현 상위
          <input
            type="number"
            min={6}
            max={45}
            value={controls.topK.value}
            disabled={!controls.topK.checked}
            onChange={(e) => controls.topK.onChange(e.target.value)}
            className="h-7 w-14 rounded-button border border-line bg-panel px-2 text-center tabular-nums outline-none focus-visible:border-text disabled:opacity-40"
          />
          개 번호만
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {result ? (
          <Button intent="secondary" onClick={result.autoFill.onClick} disabled={result.autoFill.disabled}>
            {result.autoFill.label}
          </Button>
        ) : null}
      </div>

      {lab.error ? <p className="mt-3 text-micro text-danger">{lab.error}</p> : null}

      {result ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-px overflow-hidden rounded-box border border-line/80 bg-line/80 sm:grid-cols-3">
            {[
              { name: "합이 구간에 든 과거 비율", value: result.rows.past.sumInRange, note: result.rows.theory.sumInRange },
              { name: "구간 안에서 맞힐 확률", value: result.rows.past.withinRange, note: null },
              { name: "실제 당첨 확률", value: result.rows.theory.prize, note: null },
            ].map(({ name, value, note }) => (
              <div key={name} className="bg-panel p-4">
                <p className="text-pico uppercase tracking-[0.18em] text-muted">{name}</p>
                <p className="mt-1.5 text-body font-semibold tabular-nums tracking-tight text-text">{value}</p>
                {note ? <p className="mt-1 text-nano text-muted">{note}</p> : null}
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-pico uppercase tracking-[0.18em] text-muted">{result.pool.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {result.pool.numbers.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
            </div>
          </div>

          <table className="w-full text-micro tabular-nums text-text">
            <caption className="mb-2 text-left text-nano text-muted">{result.backtest.caption}</caption>
            <thead>
              <tr className="text-nano tracking-wide text-muted">
                <th className="pb-1.5 text-left font-medium">등수</th>
                <th className="pb-1.5 text-right font-medium">가정</th>
                <th className="pb-1.5 text-right font-medium">무작위</th>
              </tr>
            </thead>
            <tbody>
              {result.backtest.rows.map(({ label, assumed, random }) => (
                <tr key={label} className="border-t border-line/70">
                  <td className="py-1.5">{label}</td>
                  <td className="py-1.5 text-right">{assumed}</td>
                  <td className="py-1.5 text-right text-muted">{random}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-nano leading-relaxed text-muted">{result.backtest.firstPrizeNote}</p>
        </div>
      ) : null}

      <div className="mt-8 border-t border-line/70 pt-6">
        <h3 className="text-micro font-semibold tracking-tight text-text">현재 조합의 인기 패턴</h3>
        {!numbers ? (
          <p className="mt-2 text-micro text-muted">먼저 번호를 생성하세요</p>
        ) : (
          <>
            <div className="mt-3 flex gap-1.5">
              {numbers.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
            </div>
            {lab.popularity.error ? <p className="mt-2 text-micro text-danger">{lab.popularity.error}</p> : null}
            {lab.popularity.messages ? (
              <ul className="mt-3 space-y-1.5 text-micro leading-relaxed text-text">
                {lab.popularity.messages.map((m) => (
                  <li key={m} className="flex gap-2">
                    <span aria-hidden className="mt-[0.55em] size-1 shrink-0 rounded-full bg-muted" />
                    {m}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-nano leading-relaxed text-muted">
              당첨 확률은 같지만, 당첨되면 나눠 가질 사람이 많을 수 있습니다. 이 목록은 알려진 경향이며 실제 구매
              데이터로 잰 것이 아닙니다.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
