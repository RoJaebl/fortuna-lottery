import { useEffect, useState } from "react";
import { useGetLotterietusStatusAction } from "./action/getLotterietusStatus.action";

/** 남은 시간(ms) → "D-3 12:34:56" — 지금 시각에 따라 바뀌므로 표시 모델이 아니라 조정자에 둔다 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "추첨 시간!";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const h = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return days > 0 ? `D-${days} ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

export function useLotterietusCardPresenter() {
  const { status, error } = useGetLotterietusStatusAction();
  const [now, setNow] = useState(() => Date.now());

  // 카운트다운의 1초 틱 — 상호작용 상태이므로 조정자가 갖는다
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    status,
    error,
    remaining: status ? formatRemaining(status.nextDrawAt.getTime() - now) : null,
  };
}
