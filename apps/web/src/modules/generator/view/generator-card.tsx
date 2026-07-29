"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import type { GeneratorMode } from "../model/generator.model";
import { ALL_NUMBERS, useGeneratorViewModel } from "../viewmodel/use-generator.viewmodel";

const MODES: { key: GeneratorMode; label: string }[] = [
  { key: "auto", label: "자동" },
  { key: "semi", label: "부분 선택" },
  { key: "manual", label: "직접 입력" },
];

interface GeneratorCardProps {
  onGenerated: (numbers: number[]) => void;
}

export function GeneratorCard({ onGenerated }: GeneratorCardProps) {
  const vm = useGeneratorViewModel(onGenerated);

  return (
    <Card title="번호 만들기" subtitle={vm.hint}>
      <div className="mb-4 flex gap-2">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => vm.changeMode(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              vm.mode === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {vm.mode !== "auto" ? (
        <div className="mb-4 grid grid-cols-9 gap-1.5">
          {ALL_NUMBERS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => vm.toggleNumber(n)}
              className={`rounded-md py-1 text-xs font-semibold tabular-nums transition-colors ${
                vm.selected.includes(n)
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={vm.generate}
        disabled={!vm.canGenerate || vm.busy}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {vm.busy ? "생성 중…" : "번호 생성"}
      </button>

      {vm.error ? <p className="mt-3 text-sm text-red-600">{vm.error}</p> : null}

      {vm.result ? (
        <div className="mt-4 flex items-center gap-1.5">
          {vm.result.map((n) => (
            <Ball key={n} n={n} size="lg" />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
