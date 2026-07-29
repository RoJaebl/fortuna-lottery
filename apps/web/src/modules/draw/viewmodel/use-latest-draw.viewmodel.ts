"use client";
import { useEffect, useState } from "react";
import { fetchRecentDraws } from "../api/client";
import type { DrawModel } from "../model/draw.model";

/** 순수 presenter — 회차 날짜 표기 */
export function formatDrawDate(drawnAt: Date): string {
  return `${drawnAt.getFullYear()}.${String(drawnAt.getMonth() + 1).padStart(2, "0")}.${String(drawnAt.getDate()).padStart(2, "0")}`;
}

export function useLatestDrawViewModel() {
  const [draw, setDraw] = useState<DrawModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentDraws(1)
      .then((draws) => setDraw(draws[0] ?? null))
      .catch((e: Error) => setError(e.message));
  }, []);

  return { draw, error, formatDrawDate };
}
