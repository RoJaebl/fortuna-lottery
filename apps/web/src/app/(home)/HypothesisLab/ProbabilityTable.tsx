import { Tooltip } from "@ui/Tooltip";
import type { LabResult } from "./HypothesisLab.presenter";

interface ProbabilityTableProps {
  rows: LabResult["rows"];
  /** 「과거 비율로 계산」이 꺼져 있으면 과거 줄을 흐리게 접는다 */
  pastRowFolded: boolean;
}

const HEAD = "pb-2 align-bottom font-medium";

/**
 * 두 줄 표 — 당첨 확률 = 합이 구간에 들 확률 × 구간 안에서 맞힐 확률.
 * 이론 줄로 곱하면 어떤 구간이든 1 / 8,145,060 이 되고, 과거 줄과의 차이는 과거의 우연이다
 */
export function ProbabilityTable({ rows, pastRowFolded }: ProbabilityTableProps) {
  const { past, theory } = rows;
  return (
    <table className="w-full text-micro tabular-nums text-text">
      <caption className="mb-3 text-left text-nano leading-relaxed text-muted">
        당첨 확률 = 합이 구간에 들 확률 × 구간 안에서 맞힐 확률. 두 줄은 앞의 곱하는 수만 다릅니다.
      </caption>
      <thead>
        <tr className="text-nano tracking-wide text-muted">
          <th className={`${HEAD} text-left`}>
            <span className="sr-only">무엇을 믿는가</span>
          </th>
          <th className={`${HEAD} text-right`}>합이 구간에 들 확률</th>
          <th className={`${HEAD} text-right`}>
            구간 안에서 맞힐 확률{" "}
            <Tooltip text="1 / 구간 안 조합 수이고, 그 수는 켠 스위치를 반영해 합이 구간에 드는 6개 조합을 모두 센 값입니다." />
          </th>
          <th className={`${HEAD} text-right`}>
            당첨 확률{" "}
            <Tooltip
              align="end"
              text="왼쪽 두 칸을 곱한 값으로, 이론 줄은 어떤 구간이든 정확히 1 / 8,145,060 이고 과거 줄과의 차이는 과거의 우연입니다."
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          data-folded={pastRowFolded}
          className="border-t border-line/70 transition-opacity duration-200 data-[folded=true]:text-nano data-[folded=true]:opacity-40"
        >
          <th scope="row" className="py-2 pr-2 text-left font-medium">
            <Tooltip align="start" text="과거 비율 — 센 회차 가운데 당첨 조합이 이 가정에 든 회차의 비율로 곱합니다.">
              {past.title}
            </Tooltip>
          </th>
          <td className="py-2 text-right">{past.sumInRange}</td>
          <td className="py-2 text-right">{past.withinRange}</td>
          <td className="py-2 text-right">{past.prize}</td>
        </tr>
        <tr className="border-t border-line/70">
          <th scope="row" className="py-2 pr-2 text-left font-medium">
            <Tooltip
              align="start"
              text="이론 비율 — 구간 안 조합 수를 전체 조합 8,145,060 으로 나눈, 공정한 추첨에서 합이 구간에 들 비율로 곱합니다."
            >
              {theory.title}
            </Tooltip>
          </th>
          <td className="py-2 text-right">{theory.sumInRange}</td>
          <td className="py-2 text-right">{theory.withinRange}</td>
          <td className="py-2 text-right font-semibold text-accent">{theory.prize}</td>
        </tr>
      </tbody>
    </table>
  );
}
