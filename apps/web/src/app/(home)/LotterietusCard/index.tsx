"use client";
import { Ball } from "@ui/Ball";
import { useLotterietusCardPresenter } from "./LotterietusCard.presenter";

/** 화면 최상단 띠 — 최근 회차, 다음 추첨까지 남은 시간, 실제 당첨 확률을 한 줄에 보인다 */
export function LotterietusCard() {
  const { loading, status, error, remaining } = useLotterietusCardPresenter();

  return (
    <section
      aria-label="회차 정보"
      className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-line/80 bg-panel px-5 py-3 sm:px-8"
    >
      {error ? <p className="text-small text-danger">{error}</p> : null}

      {status ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="leading-tight">
              <p className="text-pico uppercase tracking-[0.18em] text-muted">최근 회차</p>
              <p className="text-micro font-semibold tabular-nums text-text">
                제{status.round}회 <span className="font-normal text-muted">· {status.drawDate}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {status.numbers.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
              <span className="px-0.5 text-nano text-muted">+</span>
              <Ball n={status.bonus} size="sm" />
            </div>
          </div>

          <div className="border-line/80 leading-tight sm:border-l sm:pl-8">
            <p className="text-pico uppercase tracking-[0.18em] text-muted">제{status.nextRound}회까지</p>
            <p className="text-small font-semibold tabular-nums tracking-tight text-text">{remaining ?? "…"}</p>
          </div>
        </>
      ) : loading ? (
        <p className="text-micro text-muted">불러오는 중…</p>
      ) : null}

      <div className="leading-tight sm:ml-auto sm:text-right">
        <p className="text-pico uppercase tracking-[0.18em] text-muted">실제 당첨 확률</p>
        <p className="text-small font-semibold tabular-nums tracking-tight text-text">1/8,145,060</p>
      </div>
    </section>
  );
}
