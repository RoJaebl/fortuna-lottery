"use client";
import type { KeyboardEvent, ReactNode } from "react";
import { Ball } from "@ui/Ball";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { Tooltip } from "@ui/Tooltip";
import { RoundTimeline } from "../RoundTimeline";
import { BacktestTable } from "./BacktestTable";
import { useHypothesisLabPresenter } from "./HypothesisLab.presenter";
import { NumberBoard } from "./NumberBoard";
import { ProbabilityTable } from "./ProbabilityTable";
import { SumRangeChart } from "./SumRangeChart";

/** 단계 하나 — 번호 · 이름 · 무엇을 보는 단계인지 한 줄 */
function Step({ n, title, lead, children }: { n: number; title: string; lead: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-line/70 pt-6">
      <h3 className="flex items-baseline gap-2 text-micro font-semibold tracking-tight text-text">
        <span className="text-pico tabular-nums text-accent">{n}</span>
        {title}
      </h3>
      <p className="mt-1 mb-4 text-nano leading-relaxed text-muted">{lead}</p>
      {children}
    </section>
  );
}

const SWITCH = "size-3.5 accent-accent";
const FIELD =
  "h-7 w-16 rounded-button border border-line bg-panel px-2 text-center tabular-nums outline-none focus-visible:border-text disabled:opacity-40";

/**
 * 입력 칸은 비제어다 — 칠 때마다 묶으면 칸이 튀므로 칸을 떠나거나 Enter 를 누를 때 넘긴다.
 * 값이 바뀌면 key 가 바뀌어 칸을 새로 그린다. 묶인 값이 앞과 같으면(예: 21 에서 「5」) 칸에 앞 값을 되돌려 적는다
 */
const rangeField = (current: number, change: (value: string) => void) => {
  const commit = (input: HTMLInputElement) => {
    change(input.value);
    input.value = String(current);
  };
  return {
    defaultValue: current,
    onBlur: (e: { currentTarget: HTMLInputElement }) => commit(e.currentTarget),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commit(e.currentTarget);
    },
  };
};

export function HypothesisLab() {
  const lab = useHypothesisLabPresenter();
  const { controls, chart, result } = lab;
  const { numbers } = lab.popularity;

  return (
    <Card
      title="가정 실험실"
      subtitle="합계 구간을 가정해 보고, 그 가정이 과거에 얼마나 맞았는지 확인합니다. 어떤 구간을 골라도 실제 당첨 확률은 1/8,145,060 입니다."
      footnote="가정 확률은 가정이 참일 때만 성립합니다. 어떤 가정을 걸어도 실제 당첨 확률은 1/8,145,060 입니다."
    >
      {/* 0 회차 재생 바 — 회차가 쌓일수록 과거 비율이 이론 비율로 다가가는 것을 본다 */}
      {lab.timeline ? <RoundTimeline {...lab.timeline} /> : null}
      {lab.timeline ? (
        <p className="mt-2 text-nano leading-relaxed text-muted">
          {lab.timeline.valueText} 센 결과입니다. 재생하면 회차가 쌓일수록 과거 비율이 이론 비율로 다가가는 것이 보입니다.
        </p>
      ) : null}

      <Step
        n={1}
        title="보기"
        lead="과거 당첨 번호의 합이 어디에 몰렸고 어디가 비었는지 봅니다. 손잡이를 끌거나 옅은 띠를 눌러 실험할 구간을 고르세요."
      >
        <SumRangeChart {...chart} />
      </Step>

      <Step n={2} title="가정 걸기" lead="「다음 당첨 번호의 합은 이 구간에 든다」고 가정합니다. 스위치로 가정을 더 좁힐 수 있습니다.">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-micro text-text">
          <span className="flex items-center gap-2">
            합계
            <input
              key={`min${controls.min}`}
              type="number"
              aria-label="합계 구간 최소"
              min={chart.axis.min}
              max={chart.axis.max}
              {...rangeField(controls.min, controls.changeMin)}
              className={FIELD}
            />
            ~
            <input
              key={`max${controls.max}`}
              type="number"
              aria-label="합계 구간 최대"
              min={chart.axis.min}
              max={chart.axis.max}
              {...rangeField(controls.max, controls.changeMax)}
              className={FIELD}
            />
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-micro text-text">
          <span className="flex items-center gap-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={controls.excludePastWinners.checked}
                onChange={controls.excludePastWinners.onToggle}
                className={SWITCH}
              />
              과거 1등 조합 제외
            </label>
            <Tooltip
              align="start"
              text="센 회차까지 나온 1등 조합을 가정에서 뺍니다. 구간 안 조합 수와 이론 비율이 조금 줄 뿐 실제 당첨 확률은 그대로입니다."
            />
          </span>
          <span className="flex items-center gap-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={controls.topK.checked} onChange={controls.topK.onToggle} className={SWITCH} />
              출현 상위
              <input
                type="number"
                min={6}
                max={45}
                value={controls.topK.value}
                disabled={!controls.topK.checked}
                onChange={(e) => controls.topK.onChange(e.target.value)}
                className={FIELD}
              />
              개 번호만
            </label>
            <Tooltip text="회차마다 그 앞 회차들에서 가장 많이 나온 K개 번호로만 조합을 만든다고 가정합니다. 켜면 풀을 짓는 데 쓰는 앞선 100회는 세지 않습니다." />
          </span>
          <span className="flex items-center gap-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={controls.pastRateMode.checked} onChange={controls.pastRateMode.onToggle} className={SWITCH} />
              과거 비율로 계산
            </label>
            <Tooltip
              align="end"
              text="켜면 결과 표의 첫 줄이 과거 비율로 곱한 당첨 확률을 보입니다. 끄면 그 줄을 접고 공정한 추첨의 이론 줄만 봅니다."
            />
          </span>
        </div>
      </Step>

      <Step n={3} title="결과 읽기" lead="이 가정이 당첨 확률을 어떻게 보이게 하는지, 그리고 과거에 얼마나 맞았는지 읽습니다.">
        {lab.error ? <p className="mb-3 text-micro text-danger">{lab.error}</p> : null}
        {lab.loading ? <p className="text-micro text-muted">과거 회차로 계산하는 중…</p> : null}
        {result ? (
          <div aria-busy={lab.updating} className="space-y-6 transition-opacity duration-200 aria-busy:opacity-60">
            <div>
              <ProbabilityTable rows={result.rows} pastRowFolded={result.pastRowFolded} />
              <p className="mt-2 text-micro leading-relaxed text-text">{result.gapSentence}</p>
              <p className="mt-1 flex items-center gap-1 text-nano text-muted">
                {result.excludedLabel}
                <Tooltip text="「과거 1등 조합 제외」를 켜면 구간 안 조합 가운데 센 회차까지의 1등 조합을 이만큼 뺍니다. 꺼져 있으면 0개입니다." />
              </p>
            </div>

            <NumberBoard board={result.board} fixedLabel={result.fixedLabel} />

            <div>
              <Button intent="secondary" size="sm" onClick={result.autoFill.onClick} disabled={result.autoFill.disabled}>
                {result.autoFill.label}
              </Button>
              {result.autoFill.numbers ? (
                <div className="mt-3">
                  <div className="flex gap-1.5">
                    {result.autoFill.numbers.map((n) => (
                      <Ball key={n} n={n} size="sm" />
                    ))}
                  </div>
                  <p className="mt-2 text-nano tabular-nums leading-relaxed text-muted">
                    {result.autoFill.pastProbabilityLine ? (
                      <>
                        {result.autoFill.pastProbabilityLine}
                        <br />
                      </>
                    ) : null}
                    <span className="font-semibold text-text">{result.autoFill.realProbabilityLine}</span>
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1 text-pico uppercase tracking-[0.18em] text-muted">
                {result.pool.label}
                <Tooltip
                  align="start"
                  text="가정의 조합을 만드는 번호입니다. 출현 상위 K개를 켜면 센 마지막 회차 기준으로 많이 나온 K개, 끄면 1~45 전부입니다."
                />
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.pool.numbers.map((n) => (
                  <Ball key={n} n={n} size="sm" />
                ))}
              </div>
            </div>

            <BacktestTable {...result.backtest} />
          </div>
        ) : null}
      </Step>

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
