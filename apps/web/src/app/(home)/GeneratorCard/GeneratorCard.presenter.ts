import { useState } from "react";
import { useStore } from "supa-store/react";
import type { GeneratorMode } from "./_model/GeneratorMode.model";

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

export function useGeneratorCardPresenter() {
  const { choose } = useStore("state.home.combination", { pick: ["choose"] });
  const [mode, setMode] = useState<GeneratorMode>("auto");
  const [selected, setSelected] = useState<number[]>([]);
  const { generate: generator } = useStore("api.home.GeneratorCard.generator");

  const changeMode = (next: GeneratorMode) => {
    setMode(next);
    setSelected([]);
    // 앞선 오류만 지운다 — 오류가 없으면 앞선 결과를 그대로 두고, 진행 중이면 reset 이 응답까지 버리므로 건드리지 않는다
    if (generator.error && !generator.pending) generator.reset();
  };

  const toggleNumber = (n: number) => {
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      const limit = mode === "manual" ? 6 : 5;
      return prev.length < limit ? [...prev, n] : prev;
    });
  };

  const generate = async () => {
    const generated = await generator.mutateAsync(mode, selected).catch(() => undefined);
    if (generated) choose(generated.numbers);
  };

  return {
    modeItems: modeItemsOf(mode),
    numberItems: numberItemsOf(selected),
    showNumberGrid: mode !== "auto",
    result: generator.data?.numbers ?? null,
    error: generator.error,
    changeMode,
    toggleNumber,
    generate,
    generateDisabled: !canGenerate(mode, selected.length) || generator.pending,
    generateLabel: generateButtonLabel(generator.pending),
    hint: modeHint(mode, selected.length),
  };
}
