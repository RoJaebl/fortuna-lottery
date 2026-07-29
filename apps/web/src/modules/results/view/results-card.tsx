"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useResultsViewModel } from "../viewmodel/use-results.viewmodel";

export function ResultsCard() {
  const vm = useResultsViewModel();

  return (
    <Card
      title="결과 확인"
      subtitle={
        vm.results?.draw
          ? `제${vm.results.draw.round}회 당첨 번호와 대조`
          : "저장한 번호를 최신 회차와 대조합니다"
      }
    >
      <button
        type="button"
        onClick={vm.check}
        disabled={vm.busy}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600 disabled:opacity-40"
      >
        {vm.busy ? "대조 중…" : "당첨 대조"}
      </button>

      {vm.error ? <p className="mt-3 text-sm text-red-400">{vm.error}</p> : null}

      {vm.results ? (
        vm.results.items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">저장한 번호가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {vm.results.draw ? (
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3">
                <span className="mr-1 text-xs text-slate-400">당첨</span>
                {vm.results.draw.numbers.map((n) => (
                  <Ball key={n} n={n} size="sm" />
                ))}
                <span className="text-slate-500">+</span>
                <Ball n={vm.results.draw.bonus} size="sm" />
              </div>
            ) : null}
            <ul className="space-y-2.5">
              {vm.results.items.map((item) => (
                <li key={item.pickId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {item.numbers.map((n) => (
                      <Ball
                        key={n}
                        n={n}
                        size="sm"
                        ring={item.matchedNumbers.includes(n)}
                        dimmed={!item.matchedNumbers.includes(n)}
                      />
                    ))}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      item.rank >= 1 ? "text-amber-300" : "text-slate-500"
                    }`}
                  >
                    {vm.resultLabel(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </Card>
  );
}
