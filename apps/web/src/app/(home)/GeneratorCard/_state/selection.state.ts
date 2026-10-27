import { createStore } from "supa-store";
import type { GeneratorMode } from "../_model/GeneratorMode.model";

/** 생성기의 모드와 고른 번호 — 모드를 바꾸면 고른 번호를 비운다 */
createStore("state.home.GeneratorCard.selection", (set) => ({
  mode: "auto" as GeneratorMode,
  selected: [] as number[],
  changeMode: (mode: GeneratorMode) => set({ mode, selected: [] }),
  /** 고른 번호면 빼고, 아니면 한도(직접 입력 6 · 부분 선택 5) 안에서 더한다 */
  toggleNumber: (n: number) =>
    set(({ mode, selected }) => {
      if (selected.includes(n)) return { selected: selected.filter((x) => x !== n) };
      const limit = mode === "manual" ? 6 : 5;
      return selected.length < limit ? { selected: [...selected, n] } : {};
    }),
}));
