import { useDeletePickAction } from "./action/deletePick.action";
import { useListPicksAction } from "./action/listPicks.action";
import { useSavePickAction } from "./action/savePick.action";

/** 저장 버튼 문구 — 저장 중인가와 저장할 조합이 있는가 둘을 보므로 조정자에 둔다 */
export function saveButtonLabel(saving: boolean, hasNumbers: boolean): string {
  if (saving) return "저장 중…";
  return hasNumbers ? "현재 번호 저장" : "먼저 번호를 생성하세요";
}

export function usePicksCardPresenter(currentNumbers: number[] | null) {
  const list = useListPicksAction();
  const save = useSavePickAction();
  const remove = useDeletePickAction();

  const saveCurrent = () => {
    if (!currentNumbers) return;
    remove.clearError();
    void save.run(currentNumbers);
  };

  const removePick = (id: string) => {
    save.clearError();
    void remove.run(id);
  };

  return {
    picks: list.picks,
    // 처음 받는 동안에는 「없다」고 말하지 않는다
    empty: !list.loading && list.picks.length === 0,
    error: save.error ?? remove.error ?? list.error,
    saveLabel: saveButtonLabel(save.pending, currentNumbers !== null),
    saveDisabled: currentNumbers === null || save.pending,
    saveCurrent,
    removePick,
  };
}
