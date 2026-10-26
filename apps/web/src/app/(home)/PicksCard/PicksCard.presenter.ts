import { useStore } from "supa-store/react";

/** 저장 버튼 문구 — 저장 중인가와 저장할 조합이 있는가 둘을 보므로 조정자에 둔다 */
export function saveButtonLabel(saving: boolean, hasNumbers: boolean): string {
  if (saving) return "저장 중…";
  return hasNumbers ? "현재 번호 저장" : "먼저 번호를 생성하세요";
}

export function usePicksCardPresenter() {
  const { numbers: currentNumbers } = useStore("state.home.combination", { pick: ["numbers"] });
  const { data: picks = [], status, error, save, remove } = useStore("api.home.PicksCard.picks");
  // 처음 그릴 때(idle)도 아직 받기 전이다
  const loading = status === "idle" || status === "loading";

  // 다른 쪽의 앞선 오류만 지운다 — 진행 중이면 reset 이 pending 과 응답까지 버리므로 건드리지 않는다
  const saveCurrent = () => {
    if (!currentNumbers) return;
    if (!remove.pending) remove.reset();
    void save.mutate(currentNumbers);
  };

  const removePick = (id: string) => {
    if (!save.pending) save.reset();
    void remove.mutate(id);
  };

  return {
    loading,
    picks,
    // 처음 받는 동안에는 「없다」고 말하지 않는다
    empty: !loading && picks.length === 0,
    error: save.error ?? remove.error ?? error,
    saveLabel: saveButtonLabel(save.pending, currentNumbers !== null),
    saveDisabled: currentNumbers === null || save.pending,
    saveCurrent,
    removePick,
  };
}
