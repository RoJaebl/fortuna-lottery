"use client";
import { Ball } from "@/shared/ui/ball";
import { useLotterietusCardPresenter } from "./LotterietusCard.presenter";

interface LotterietusCardProps {
  /** 생성기 패널이 펼쳐져 있는지 — CTA 라벨과 aria-expanded에 사용 */
  generatorOpen: boolean;
  onToggleGenerator: () => void;
}

/** 홈 최상단 Hero — 최근 회차와 다음 추첨 카운트다운을 동등한 비중으로 보여주고 생성기 CTA를 제공 */
export function LotterietusCard({ generatorOpen, onToggleGenerator }: LotterietusCardProps) {
  const { status, error, remaining } = useLotterietusCardPresenter();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {status ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">
              최근 회차 · 제{status.round}회 · {status.drawDate} 추첨
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {status.numbers.map((n) => (
                <Ball key={n} n={n} size="lg" />
              ))}
              <span className="mx-1 text-slate-400">+</span>
              <Ball n={status.bonus} size="md" />
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-6">
            <p className="text-xs text-slate-500">
              다음 추첨까지 · 제{status.nextRound}회 · 매주 토요일 20:35
            </p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-sky-600">{remaining ?? "…"}</p>
          </div>
        </div>
      ) : !error ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : null}

      <button
        type="button"
        onClick={onToggleGenerator}
        aria-expanded={generatorOpen}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
      >
        {generatorOpen ? "생성기 닫기" : "번호 생성하기"}
      </button>
    </section>
  );
}
