"use client";
import { Ball } from "@ui/Ball";
import { useLotterietusCardPresenter } from "./LotterietusCard.presenter";

/** 화면 최상단 띠 — 최근 회차, 다음 추첨까지 남은 시간, 실제 당첨 확률을 한 줄에 보인다 */
export function LotterietusCard() {
  const { loading, status, error, remaining } = useLotterietusCardPresenter();

  return (
    <section
      aria-label="회차 정보"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-panel px-4 py-2 sm:px-6"
    >
      {error ? <p className="text-small text-danger">{error}</p> : null}

      {status ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-micro text-muted">
              제{status.round}회 · {status.drawDate}
            </span>
            {status.numbers.map((n) => (
              <Ball key={n} n={n} size="sm" />
            ))}
            <span className="text-muted">+</span>
            <Ball n={status.bonus} size="sm" />
          </div>

          <p className="text-micro text-muted">
            제{status.nextRound}회까지{" "}
            <span className="text-small font-semibold tabular-nums text-text">{remaining ?? "…"}</span>
          </p>
        </>
      ) : loading ? (
        <p className="text-micro text-muted">불러오는 중…</p>
      ) : null}

      <p className="text-micro text-muted sm:ml-auto">
        당첨 확률 <span className="text-small font-semibold tabular-nums text-text">1/8,145,060</span>
      </p>
    </section>
  );
}
