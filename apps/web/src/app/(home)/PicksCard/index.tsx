"use client";
import { Ball } from "@ui/Ball";
import { Button } from "@ui/Button";
import { Card } from "@ui/Card";
import { usePicksCardPresenter } from "./PicksCard.presenter";

export function PicksCard() {
  const card = usePicksCardPresenter();

  return (
    <Card
      title="내 번호"
      subtitle="저장한 조합은 매주 추첨 결과와 자동 대조됩니다"
      footnote="MVP는 게스트 모드로 서버 메모리에 저장됩니다 (재시작 시 초기화)."
    >
      <Button onClick={card.saveCurrent} disabled={card.saveDisabled}>
        {card.saveLabel}
      </Button>

      {card.error ? <p className="mt-3 text-micro text-danger">{card.error}</p> : null}

      {card.empty ? <p className="mt-5 text-micro text-muted">아직 저장한 번호가 없습니다.</p> : null}

      {card.picks.length > 0 ? (
        <ul className="mt-5 divide-y divide-line/70 border-y border-line/70">
          {card.picks.map((pick) => (
            <li key={pick.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-1.5">
                {pick.numbers.map((n) => (
                  <Ball key={n} n={n} size="sm" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-nano tabular-nums text-muted">{pick.savedAt}</span>
                <Button intent="ghost" size="sm" onClick={() => card.removePick(pick.id)} aria-label="삭제">
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

