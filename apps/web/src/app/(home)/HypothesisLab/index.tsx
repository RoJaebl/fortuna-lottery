"use client";
import { Ball } from "@ui/ball";
import { Card } from "@ui/card";
import { useHypothesisLabPresenter } from "./HypothesisLab.presenter";

const BUTTON =
  "rounded-box bg-strong px-4 py-2 text-small font-semibold text-on-strong transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

export function HypothesisLab() {
  const lab = useHypothesisLabPresenter();
  const { numbers } = lab;
  const result = lab.evaluation;

  return (
    <Card
      title="가정 실험실"
      subtitle="가정을 걸면 확률이 어떻게 보이는지, 그 가정이 과거에 얼마나 맞았는지 함께 봅니다."
      footnote="가정 확률은 가정이 참일 때만 성립합니다. 어떤 가정을 걸어도 실제 당첨 확률은 1/8,145,060 입니다."
    >
      <div className="flex flex-wrap items-center gap-4 text-small text-text">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={lab.excludePastWinners} onChange={lab.toggleExcludePastWinners} />
          과거 1등 조합 제외
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={lab.topKEnabled} onChange={lab.toggleTopK} />
          출현 상위
          <input
            type="number"
            min={6}
            max={45}
            value={lab.topK}
            disabled={!lab.topKEnabled}
            onChange={(e) => lab.changeTopK(e.target.value)}
            className="w-16 rounded-button border border-line bg-inset px-2 py-1 tabular-nums disabled:opacity-40"
          />
          개 번호만
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={lab.evaluate} disabled={lab.evaluateDisabled} className={BUTTON}>
          {lab.evaluateLabel}
        </button>
        <button type="button" onClick={lab.generate} disabled={lab.generateDisabled} className={BUTTON}>
          {lab.generateLabel}
        </button>
      </div>

      {lab.error ? <p className="mt-3 text-small text-danger">{lab.error}</p> : null}

      {result ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "가정 확률", value: result.assumedProbabilityLabel, note: null },
              { name: "가정 적중률", value: result.hitRateLabel, note: result.expectedRateLabel },
              { name: "실제 확률", value: result.realProbabilityLabel, note: null },
            ].map(({ name, value, note }) => (
              <div key={name} className="rounded-box bg-said p-3">
                <p className="text-micro text-muted">{name}</p>
                <p className="mt-1 text-small font-semibold tabular-nums text-text">{value}</p>
                {note ? <p className="mt-1 text-micro text-muted">{note}</p> : null}
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-micro text-muted">풀 ({result.pool.length}개)</p>
            <div className="flex flex-wrap gap-1">
              {result.pool.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
            </div>
          </div>

          <table className="w-full text-small tabular-nums text-text">
            <caption className="mb-2 text-left text-micro text-muted">
              {result.backtestCaption}
            </caption>
            <thead>
              <tr className="text-micro text-muted">
                <th className="text-left font-medium">등수</th>
                <th className="text-right font-medium">가정</th>
                <th className="text-right font-medium">무작위</th>
              </tr>
            </thead>
            <tbody>
              {result.backtestRows.map(({ label, assumed, random }) => (
                <tr key={label} className="border-t border-line">
                  <td className="py-1">{label}</td>
                  <td className="py-1 text-right">{assumed.toLocaleString()}</td>
                  <td className="py-1 text-right">{random.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-micro text-muted">{result.firstPrizeNote}</p>
        </div>
      ) : null}

      <div className="mt-6 border-t border-line pt-4">
        <h3 className="text-small font-semibold text-text">현재 조합의 인기 패턴</h3>
        {!numbers ? (
          <p className="mt-2 text-small text-muted">먼저 번호를 생성하세요</p>
        ) : (
          <>
            <div className="mt-2 flex gap-2">
              {numbers.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
            </div>
            {lab.popularityError ? <p className="mt-2 text-small text-danger">{lab.popularityError}</p> : null}
            {lab.popularityMessages ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-text">
                {lab.popularityMessages.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-micro text-muted">
              당첨 확률은 같지만, 당첨되면 나눠 가질 사람이 많을 수 있습니다. 이 목록은 알려진 경향이며 실제 구매
              데이터로 잰 것이 아닙니다.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

