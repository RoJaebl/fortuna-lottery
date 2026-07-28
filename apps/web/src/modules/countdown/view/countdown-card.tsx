"use client";
import { Card } from "@/shared/ui/card";
import { useCountdownViewModel } from "../viewmodel/use-countdown.viewmodel";

export function CountdownCard() {
  const { countdown, remaining } = useCountdownViewModel();

  return (
    <Card
      title="다음 추첨까지"
      subtitle={countdown ? `제${countdown.nextRound}회 · 매주 토요일 20:35` : undefined}
    >
      <p className="text-3xl font-bold tabular-nums tracking-tight text-emerald-600">
        {remaining ?? "…"}
      </p>
    </Card>
  );
}
