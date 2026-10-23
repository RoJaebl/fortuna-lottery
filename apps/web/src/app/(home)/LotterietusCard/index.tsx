"use client";
import { Ball } from "@ui/Ball";
import { useLotterietusCardPresenter } from "./LotterietusCard.presenter";

/** 홈 최상단 Hero — 최근 회차와 다음 추첨 카운트다운을 동등한 비중으로 보여주고 생성기 CTA를 제공 */
export function LotterietusCard() {
  const { loading, status, error, remaining, ctaLabel, generatorOpen, toggleGenerator } =
    useLotterietusCardPresenter();

  return (
    <section className="rounded-panel border border-line bg-panel p-6 sm:p-8">
      {error ? <p className="text-small text-danger">{error}</p> : null}

      {status ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-micro text-muted">
              최근 회차 · 제{status.round}회 · {status.drawDate} 추첨
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {status.numbers.map((n) => (
                <Ball key={n} n={n} size="lg" />
              ))}
              <span className="mx-1 text-muted">+</span>
              <Ball n={status.bonus} size="md" />
            </div>
          </div>

          <div className="sm:border-l sm:border-line sm:pl-6">
            <p className="text-micro text-muted">
              다음 추첨까지 · 제{status.nextRound}회 · 매주 토요일 20:35
            </p>
            <p className="mt-3 text-display font-bold tabular-nums text-text">{remaining ?? "…"}</p>
          </div>
        </div>
      ) : loading ? (
        <p className="text-small text-muted">불러오는 중…</p>
      ) : null}

      <button
        type="button"
        onClick={toggleGenerator}
        aria-expanded={generatorOpen}
        className="mt-6 w-full rounded-card bg-strong px-6 py-3 text-body font-semibold text-on-strong transition-colors hover:opacity-90 sm:w-auto"
      >
        {ctaLabel}
      </button>
    </section>
  );
}

