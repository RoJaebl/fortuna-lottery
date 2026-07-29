"use client";
import { useEffect, useState } from "react";
import { fetchCountdown } from "../api/client";
import type { CountdownModel } from "../model/countdown.model";

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

export function useCountdownViewModel() {
  const [countdown, setCountdown] = useState<CountdownModel | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchCountdown().then(setCountdown).catch(() => setCountdown(null));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = countdown ? formatRemaining(countdown.nextDrawAt.getTime() - now) : null;
  return { countdown, remaining };
}
