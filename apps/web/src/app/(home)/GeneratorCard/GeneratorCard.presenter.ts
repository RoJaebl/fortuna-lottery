import { useState } from "react";
import type { GeneratorMode } from "./_model/GeneratorMode.model";
import { useGenerateCombinationAction } from "./_action/generateCombination.action";

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

const MODES: readonly { key: GeneratorMode; label: string }[] = [
  { key: "auto", label: "자동" },
  { key: "semi", label: "부분 선택" },
  { key: "manual", label: "직접 입력" },
];

/** 모드·선택 상태에 따른 생성 가능 여부 — 모드와 선택 둘을 보므로 조정자에 둔다 */
export function canGenerate(mode: GeneratorMode, selectedCount: number): boolean {
  if (mode === "auto") return true;
  if (mode === "semi") return selectedCount >= 1 && selectedCount <= 5;
  return selectedCount === 6; // manual
}

/** 모드별 안내 문구 */
export function modeHint(mode: GeneratorMode, selectedCount: number): string {
  if (mode === "auto") return "6개 번호를 무작위로 생성합니다";
  if (mode === "semi") return `포함할 번호를 1~5개 선택하세요 (${selectedCount}개 선택됨)`;
  return `6개 번호를 직접 선택하세요 (${selectedCount}/6)`;
}

/** 모드 버튼 항목 — 지금 모드를 active 로 표시한다 */
export function modeItemsOf(mode: GeneratorMode): { key: GeneratorMode; label: string; active: boolean }[] {
  return MODES.map(({ key, label }) => ({ key, label, active: key === mode }));
}

/** 번호 격자 항목 — 고른 번호를 selected 로 표시한다 */
export function numberItemsOf(selected: readonly number[]): { n: number; selected: boolean }[] {
  const picked = new Set(selected);
  return ALL_NUMBERS.map((n) => ({ n, selected: picked.has(n) }));
}

/** 생성 버튼 문구 */
export function generateButtonLabel(busy: boolean): string {
  return busy ? "생성 중…" : "번호 생성";
}

export function useGeneratorCardPresenter(onGenerated: (numbers: number[]) => void) {
  const [mode, setMode] = useState<GeneratorMode>("auto");
  const [selected, setSelected] = useState<number[]>([]);
  const action = useGenerateCombinationAction();

  const changeMode = (next: GeneratorMode) => {
    setMode(next);
    setSelected([]);
    action.clearError();
  };

  const toggleNumber = (n: number) => {
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      const limit = mode === "manual" ? 6 : 5;
      return prev.length < limit ? [...prev, n] : prev;
    });
  };

  const generate = async () => {
    const combination = await action.run(mode, selected);
    if (combination) onGenerated(combination.numbers);
  };

  return {
    modeItems: modeItemsOf(mode),
    numberItems: numberItemsOf(selected),
    showNumberGrid: mode !== "auto",
    result: action.result?.numbers ?? null,
    error: action.error,
    changeMode,
    toggleNumber,
    generate,
    generateDisabled: !canGenerate(mode, selected.length) || action.pending,
    generateLabel: generateButtonLabel(action.pending),
    hint: modeHint(mode, selected.length),
  };
}
