import { Tooltip } from "@ui/Tooltip";
import type { LabResult } from "./HypothesisLab.presenter";

/** 백테스트 — 가정 우주에서 산 장수와 무작위로 산 장수가 등수마다 몇 장 맞았는지 */
export function BacktestTable({ caption, rows, firstPrizeNote }: LabResult["backtest"]) {
  return (
    <div>
      <p className="flex items-center gap-1 text-micro font-medium text-text">
        센 회차마다 가정 우주에서 20장, 무작위로 20장을 샀다면
        <Tooltip
          align="end"
          text="센 회차마다 이 가정을 만족하는 조합에서 고르게 20장, 1~45 에서 무작위로 20장을 사서 그 회차 당첨 번호와 맞춰 본 장수입니다."
        />
      </p>
      <table className="mt-2 w-full text-micro tabular-nums text-text">
        <caption className="mb-2 text-left text-nano text-muted">{caption}</caption>
        <thead>
          <tr className="text-nano tracking-wide text-muted">
            <th className="pb-1.5 text-left font-medium">등수</th>
            <th className="pb-1.5 text-right font-medium">가정</th>
            <th className="pb-1.5 text-right font-medium">무작위</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, assumed, random }) => (
            <tr key={label} className="border-t border-line/70">
              <td className="py-1.5">{label}</td>
              <td className="py-1.5 text-right">{assumed}</td>
              <td className="py-1.5 text-right text-muted">{random}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-nano leading-relaxed text-muted">
        두 열이 비슷하게 나오는 것 자체가 가정이 당첨 확률을 올리지 않는다는 증거입니다. {firstPrizeNote}
      </p>
    </div>
  );
}
