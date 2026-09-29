"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { usePicksCardPresenter } from "./PicksCard.presenter";

interface PicksCardProps {
  /** 현재 생성된 조합 (없으면 저장 버튼 비활성) */
  currentNumbers: number[] | null;
}

export function PicksCard({ currentNumbers }: PicksCardProps) {
  const card = usePicksCardPresenter(currentNumbers);

  return (
    <Card
      title="내 번호"
      subtitle="저장한 조합은 매주 추첨 결과와 자동 대조됩니다"
      footnote="MVP는 게스트 모드로 서버 메모리에 저장됩니다 (재시작 시 초기화)."
    >
      <button
        type="button"
        onClick={card.saveCurrent}
        disabled={card.saveDisabled}
        className="mb-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {card.saveLabel}
      </button>

      {card.error ? <p className="mb-3 text-sm text-red-600">{card.error}</p> : null}

      {card.empty ? <p className="text-sm text-slate-500">아직 저장한 번호가 없습니다.</p> : null}

      {card.picks.length > 0 ? (
        <ul className="space-y-2.5">
          {card.picks.map((pick) => (
            <li key={pick.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {pick.numbers.map((n) => (
                  <Ball key={n} n={n} size="sm" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{pick.savedAt}</span>
                <button
                  type="button"
                  onClick={() => card.removePick(pick.id)}
                  className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
