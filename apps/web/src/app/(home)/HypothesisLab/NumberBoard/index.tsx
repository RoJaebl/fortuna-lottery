import type { LabBoardNumber } from "../HypothesisLab.presenter";
import { numberBoard } from "./NumberBoard.styles";

interface NumberBoardProps {
  board: LabBoardNumber[];
  /** 「고른 번호 2 / 5」 */
  fixedLabel: string;
}

/** 45개 번호판 — 이 가정 아래 만들 수 없는 번호는 흐리게, 합이 구간에 든 과거 회차에서 나온 횟수는 작은 숫자로 */
export function NumberBoard({ board, fixedLabel }: NumberBoardProps) {
  const s = numberBoard();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-nano leading-relaxed text-muted">
          번호를 누르면 그 번호를 넣은 조합으로 가정을 좁힙니다. 흐린 번호는 지금 가정으로 만들 수 없고, 작은 숫자는 합이 구간에 든
          과거 회차에서 그 번호가 나온 횟수입니다.
        </p>
        <p className="shrink-0 text-nano tabular-nums text-muted">{fixedLabel}</p>
      </div>
      <div className="grid grid-cols-9 gap-1">
        {board.map(({ n, countLabel, possible, selected, disabled, onToggle }) => {
          const state = selected ? "selected" : possible ? "possible" : "impossible";
          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              aria-label={`${n}번 · 과거 ${countLabel}회`}
              disabled={disabled}
              onClick={onToggle}
              className={s.cell({ state })}
            >
              <span className="text-micro font-semibold tabular-nums">{n}</span>
              <span className={s.count({ state })}>{countLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
