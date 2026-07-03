"use client";
import { useState } from "react";
import { fetchResults } from "../api/client";
import type { ResultItemModel, ResultsModel } from "../model/results.model";

/** 순수 presenter — 등수/근접 표기 (사실 그대로, 과장 없음) */
export function resultLabel(item: ResultItemModel): string {
  if (item.rank >= 1) return `${item.rank}등`;
  if (item.matchedCount > 0) {
    return `${item.matchedCount}개 일치${item.bonusMatched ? " + 보너스" : ""} — 낙첨`;
  }
  return item.bonusMatched ? "보너스만 일치 — 낙첨" : "일치 없음 — 낙첨";
}

export function useResultsViewModel() {
  const [results, setResults] = useState<ResultsModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      setResults(await fetchResults());
    } catch (e) {
      setError(e instanceof Error ? e.message : "결과 확인에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  return { results, error, busy, check, resultLabel };
}
