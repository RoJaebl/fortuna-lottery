"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { usePicksViewModel } from "../viewmodel/use-picks.viewmodel";

interface PicksCardProps {
  /** 현재 생성된 조합 (없으면 저장 버튼 비활성) */
  currentNumbers: number[] | null;
}

export function PicksCard({ currentNumbers }: PicksCardProps) {
  const vm = usePicksViewModel();

  return (
    <Card
      title="내 번호"
      subtitle="저장한 조합은 매주 추첨 결과와 자동 대조됩니다"
      footnote="MVP는 게스트 모드로 서버 메모리에 저장됩니다 (재시작 시 초기화)."
    >
      <button
        type="button"
        onClick={() => currentNumbers && vm.save(currentNumbers)}
        disabled={!currentNumbers || vm.busy}
        className="mb-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {vm.busy ? "저장 중…" : currentNumbers ? "현재 번호 저장" : "먼저 번호를 생성하세요"}
      </button>

      {vm.error ? <p className="mb-3 text-sm text-red-400">{vm.error}</p> : null}

      {vm.picks.length === 0 ? (
        <p className="text-sm text-slate-500">아직 저장한 번호가 없습니다.</p>
      ) : (
        <ul className="space-y-2.5">
          {vm.picks.map((pick) => (
            <li key={pick.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {pick.numbers.map((n) => (
                  <Ball key={n} n={n} size="sm" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{vm.formatSavedAt(pick.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => vm.remove(pick.id)}
                  className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
