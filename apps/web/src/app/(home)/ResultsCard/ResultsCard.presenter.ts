import { useStore } from "@fortuna-lottery/store/react";

/** 부제 — 받은 결과에 기준 회차가 있는가를 보므로 조정자에 둔다 */
export function resultsSubtitle(round: number | null): string {
  return round !== null ? `제${round}회 당첨 번호와 대조` : "저장한 번호를 최신 회차와 대조합니다";
}

export function useResultsCardPresenter() {
  const { data: results = null, status, error, refetch } = useStore("api.home.ResultsCard.check");
  const pending = status === "loading";

  return {
    subtitle: resultsSubtitle(results?.draw?.round ?? null),
    checkLabel: pending ? "대조 중…" : "당첨 대조",
    checkDisabled: pending,
    /** 사람이 「당첨 대조」를 눌렀다 — 누를 때마다 받는다 */
    check: refetch,
    error,
    /** 아직 대조하지 않았으면 결과 영역을 그리지 않는다 */
    checked: results !== null,
    empty: results !== null && results.items.length === 0,
    draw: results?.draw ?? null,
    items: results?.items ?? [],
  };
}
