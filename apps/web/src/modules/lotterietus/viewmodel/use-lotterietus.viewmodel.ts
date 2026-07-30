"use client";
import { useEffect, useState } from "react";
import { fetchLotterietusStatus } from "../api/client";
import type { LotterietusModel } from "../model/lotterietus.model";

/** 순수 presenter — 회차 날짜 표기 */
export function formatDrawDate(drawnAt: Date): string {
  return `${drawnAt.getFullYear()}.${String(drawnAt.getMonth() + 1).padStart(2, "0")}.${String(drawnAt.getDate()).padStart(2, "0")}`;
}

/** 순수 presenter — 남은 시간(ms) → "D-3 12:34:56" */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "추첨 시간!";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const h = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return days > 0 ? `D-${days} ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

export function useLotterietusViewModel() {
  const [data, setData] = useState<LotterietusModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchLotterietusStatus()
      .then(setData)
      .catch((e: Error) => setError(e.message));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = data ? formatRemaining(data.nextDrawAt.getTime() - now) : null;
  return { data, error, remaining, formatDrawDate };
}
