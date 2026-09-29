import { useBacktestCombinationAction } from "./action/backtestCombination.action";

/** 실행 버튼 문구 — 진행 중인가와 대입할 조합이 있는가 둘을 보므로 조정자에 둔다 */
export function runButtonLabel(busy: boolean, hasNumbers: boolean): string {
  if (busy) return "확인 중…";
  return hasNumbers ? "과거 전 회차 대입" : "먼저 번호를 생성하세요";
}

export function useSimulationCardPresenter(numbers: number[] | null) {
  const action = useBacktestCombinationAction();

  const run = () => {
    if (!numbers) return;
    void action.run(numbers);
  };

  return {
    result: action.result,
    error: action.error,
    runLabel: runButtonLabel(action.pending, numbers !== null),
    runDisabled: !numbers || action.pending,
    run,
  };
}
