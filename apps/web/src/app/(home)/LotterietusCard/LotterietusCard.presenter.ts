import { useEffect, useState } from "react";
import { useStore } from "supa-store/react";

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
  const { data: status = null, status: fetchStatus, error } = useStore("api.home.LotterietusCard.status");
  // 처음 그릴 때(idle)도 아직 받기 전이다
  const loading = fetchStatus === "idle" || fetchStatus === "loading";
  const [now, setNow] = useState(() => Date.now());

  // 카운트다운의 1초 틱 — 상호작용 상태이므로 조정자가 갖는다
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    /** 보여 줄 회차가 아직 없이 받는 중 — 앞선 회차가 있으면 그것을 계속 보인다 */
    loading: loading && !status,
    status,
    error,
    remaining: status ? formatRemaining(status.nextDrawAt.getTime() - now) : null,
  };
}
