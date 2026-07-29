"use client";
import { useState } from "react";
import { postGenerate } from "../api/client";
import type { GeneratorMode } from "../model/generator.model";
import { mapGenerateRequest } from "../transport/mapper/generate-request.mapper";

export const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

/** 순수 presenter — 모드·선택 상태에 따른 생성 가능 여부 */
export function canGenerate(mode: GeneratorMode, selectedCount: number): boolean {
  if (mode === "auto") return true;
  if (mode === "semi") return selectedCount >= 1 && selectedCount <= 5;
  return selectedCount === 6; // manual
}

/** 순수 presenter — 모드별 안내 문구 */
export function modeHint(mode: GeneratorMode, selectedCount: number): string {
  if (mode === "auto") return "6개 번호를 무작위로 생성합니다";
  if (mode === "semi") return `포함할 번호를 1~5개 선택하세요 (${selectedCount}개 선택됨)`;
  return `6개 번호를 직접 선택하세요 (${selectedCount}/6)`;
}

export function useGeneratorViewModel(onGenerated: (numbers: number[]) => void) {
  const [mode, setMode] = useState<GeneratorMode>("auto");
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const changeMode = (next: GeneratorMode) => {
    setMode(next);
    setSelected([]);
    setError(null);
  };

  const toggleNumber = (n: number) => {
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      const limit = mode === "manual" ? 6 : 5;
      return prev.length < limit ? [...prev, n] : prev;
    });
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const combo = await postGenerate(mapGenerateRequest(mode, selected));
      setResult(combo.numbers);
      onGenerated(combo.numbers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  return {
    mode,
    selected,
    result,
    error,
    busy,
    changeMode,
    toggleNumber,
    generate,
    canGenerate: canGenerate(mode, selected.length),
    hint: modeHint(mode, selected.length),
  };
}
