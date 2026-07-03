"use client";
import { useState } from "react";
import { postBacktest } from "../api/client";
import type { BacktestModel } from "../model/simulation.model";

export const RANK_LABELS = ["낙첨", "1등", "2등", "3등", "4등", "5등"] as const;

/** 순수 presenter — 등수별 요약 행 (당첨 있는 등수만) */
export function summarizeRanks(model: BacktestModel): { rank: number; label: string; count: number }[] {
  return [1, 2, 3, 4, 5]
    .map((rank) => ({ rank, label: RANK_LABELS[rank] as string, count: model.rankCounts[rank] ?? 0 }))
    .filter((r) => r.count > 0);
}

/** 순수 presenter — 정직한 한 줄 요약 */
export function summaryLine(model: BacktestModel): string {
  const totalWins = model.wins.length;
  if (totalWins === 0) {
    return `전 ${model.totalDraws.toLocaleString()}회차에서 5등 이상 당첨이 없었습니다.`;
  }
  return `전 ${model.totalDraws.toLocaleString()}회차 중 ${totalWins.toLocaleString()}번 당첨되었을 조합입니다 (5등 이상).`;
}

export function useSimulationViewModel(numbers: number[] | null) {
  const [result, setResult] = useState<BacktestModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!numbers) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await postBacktest(numbers));
    } catch (e) {
      setError(e instanceof Error ? e.message : "시뮬레이션에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  return { result, error, busy, run, summarizeRanks, summaryLine };
}
