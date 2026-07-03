"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchPicks, removePick, savePick } from "../api/client";
import type { PickModel } from "../model/pick.model";

/** 순수 presenter — 저장 시각 표기 */
export function formatSavedAt(createdAt: Date): string {
  const y = createdAt.getFullYear();
  const mo = String(createdAt.getMonth() + 1).padStart(2, "0");
  const d = String(createdAt.getDate()).padStart(2, "0");
  const h = String(createdAt.getHours()).padStart(2, "0");
  const mi = String(createdAt.getMinutes()).padStart(2, "0");
  return `${y}.${mo}.${d} ${h}:${mi}`;
}

export function usePicksViewModel() {
  const [picks, setPicks] = useState<PickModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    fetchPicks()
      .then(setPicks)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(reload, [reload]);

  const save = async (numbers: number[]) => {
    setBusy(true);
    setError(null);
    try {
      await savePick(numbers);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await removePick(id);
      setPicks((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
    }
  };

  return { picks, error, busy, save, remove, formatSavedAt };
}
