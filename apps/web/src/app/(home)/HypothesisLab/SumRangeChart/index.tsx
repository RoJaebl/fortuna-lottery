"use client";
import { useRef, type KeyboardEvent } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";
import { Tooltip } from "@ui/Tooltip";
import type { LabChart } from "../HypothesisLab.presenter";
import { sumRangeChart } from "./SumRangeChart.styles";

gsap.registerPlugin(Draggable, useGSAP);

const W = 560;
const H = 120;
/** 가로축 눈금 — 양 끝 사이 40 배수 언저리. 숫자는 차트 폭과 상관없이 text-pico 로 서도록 HTML 층에 둔다 */
const TICKS = [60, 100, 140, 180, 220];
/** 막대가 값이 바뀔 때 끊기지 않고 이어서 움직이게 하는 전환 — 통계 탭의 합계 분포와 같다 */
const SMOOTH = { transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)" } as const;

/**
 * 1 보기 — 합계별 과거 회차 막대 위에 많이 든 구간·빈 구간·고른 구간 띠를 겹친다.
 * 차트 위 두 손잡이(GSAP Draggable)를 끌면 고른 구간이 따라 바뀐다. 손잡이가 엇갈려도 store 가 정렬해 받는다
 */
export function SumRangeChart({ axis, bars, frequentBands, emptyBands, frequentLegend, emptyLegend, selected, onSelect }: LabChart) {
  const s = sumRangeChart();
  const slots = axis.max - axis.min + 1;
  const slot = W / slots;
  /** 합계 s 칸의 왼쪽 끝(viewBox 단위) */
  const left = (sum: number) => (sum - axis.min) * slot;

  const layerRef = useRef<HTMLDivElement>(null);
  const handleRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const dragRefs = useRef<Draggable[]>([]);
  // Draggable 은 한 번 짓고 최신 값은 ref 로 읽는다
  const latest = useRef({ axis, selected, onSelect });
  latest.current = { axis, selected, onSelect };

  const width = () => layerRef.current?.clientWidth ?? 0;
  /** 손잡이 자리(px) ↔ 합계 — 손잡이는 합계 칸의 가운데에 선다 */
  const sumAt = (x: number) => {
    const { min, max } = latest.current.axis;
    const room = width();
    const i = room > 0 ? Math.floor((x / room) * (max - min + 1)) : 0;
    return min + Math.min(Math.max(i, 0), max - min);
  };
  const xOf = (sum: number) => {
    const { min, max } = latest.current.axis;
    return ((sum - min + 0.5) / (max - min + 1)) * width();
  };
  const xNow = (el: HTMLElement) => Number(gsap.getProperty(el, "x"));

  /** 두 손잡이를 고른 구간의 양 끝으로 옮긴다 — 왼쪽에 있는 손잡이가 최소를 맡아 손잡이가 서로 자리를 바꾸지 않는다 */
  const place = (duration: number) => {
    const [a, b] = handleRefs.map((r) => r.current);
    if (!a || !b) return;
    const { min, max } = latest.current.selected;
    const targets = xNow(a) <= xNow(b) ? [min, max] : [max, min];
    [a, b].forEach((el, i) => {
      const sum = targets[i]!;
      el.setAttribute("aria-valuenow", String(sum));
      el.setAttribute("aria-valuetext", `합계 ${sum}`);
      if (dragRefs.current[i]?.isDragging) return;
      gsap.to(el, {
        x: xOf(sum),
        duration,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          dragRefs.current[i]?.update();
        },
      });
    });
  };

  /**
   * 손잡이가 맡은 값 — place 가 고른 구간의 최소·최대 가운데 하나를 aria-valuenow 에 곧바로 적는다.
   * 미끄러지는 중인 자리(x)가 아니라 이 값을 읽어야 키를 누르고 있을 때 한 번에 한 칸씩 바로 움직인다
   */
  const valueOf = (el: HTMLElement) => Number(el.getAttribute("aria-valuenow"));

  /** 손잡이 i 를 합계 sum 에 두고, 다른 손잡이의 값과 함께 고른 구간으로 알린다 */
  const select = (i: number, sum: number) => {
    const other = handleRefs[1 - i]!.current;
    if (!other) return;
    const pair = [sum, valueOf(other)].sort((p, q) => p - q);
    // 끄는 동안 같은 칸 안에서 움직이면 알리지 않는다
    const { min, max } = latest.current.selected;
    if (pair[0] !== min || pair[1] !== max) latest.current.onSelect(pair[0]!, pair[1]!);
  };

  useGSAP(() => {
    const layer = layerRef.current;
    if (!layer) return;
    dragRefs.current = handleRefs.flatMap((ref, i) =>
      ref.current
        ? Draggable.create(ref.current, {
            type: "x",
            onPress() {
              this.applyBounds({ minX: 0, maxX: width() });
            },
            onDrag() {
              select(i, sumAt(this.x));
            },
            // 놓으면 손잡이를 합계 칸 가운데에 맞춘다
            onRelease: () => place(0.15),
          })
        : [],
    );
    place(0);
    // 폭이 바뀌면 손잡이를 새 폭의 자리로 옮긴다
    const resize = new ResizeObserver(() => place(0));
    resize.observe(layer);
    return () => resize.disconnect();
  }, []);

  // 입력 칸·띠 클릭·끌기로 구간이 바뀌면 손잡이가 그 자리로 미끄러진다. 끄는 손잡이는 손이 자리를 정한다
  useGSAP(() => place(0.25), [selected.min, selected.max]);

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -10, PageUp: 10 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    select(i, valueOf(e.currentTarget) + step);
  };

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
          <defs>
            <pattern id="sum-range-hatch" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={5} stroke="var(--ui-muted)" strokeOpacity={0.35} strokeWidth={1.5} />
            </pattern>
          </defs>
          {/* 옅은 보조선 — 가장 높은 막대와 그 절반 */}
          {[0, 0.5].map((y) => (
            <line key={y} x1={0} y1={y * H} x2={W} y2={y * H} stroke="var(--ui-line)" strokeWidth={0.75} strokeDasharray="2 3" />
          ))}
          {emptyBands.map((b) => (
            <rect key={`e${b.min}`} x={left(b.min)} y={0} width={(b.max - b.min + 1) * slot} height={H} className={s.band({ kind: "empty" })}>
              <title>{b.label}</title>
            </rect>
          ))}
          {frequentBands.map((b) => (
            <rect
              key={`f${b.min}`}
              x={left(b.min)}
              y={0}
              width={(b.max - b.min + 1) * slot}
              height={H}
              className={s.band({ kind: "frequent" })}
              onClick={() => onSelect(b.min, b.max)}
            >
              <title>{b.label}</title>
            </rect>
          ))}
          {/* 막대는 전체 높이로 그려 두고 scaleY 로 늘인다 — 재생 중에 길이가 이어서 움직인다 */}
          {bars.map(({ sum, height }) => (
            <rect
              key={sum}
              x={left(sum) + slot * 0.15}
              y={0}
              width={slot * 0.7}
              height={H}
              rx={0.6}
              fill="var(--ui-accent)"
              opacity={0.8}
              pointerEvents="none"
              style={{ ...SMOOTH, transformOrigin: `0 ${H}px`, transform: `scaleY(${height})` }}
            />
          ))}
          {/* 고른 구간 — 칸 하나 폭의 띠를 옮기고 늘인다. 테두리 두께는 늘이지 않는다 */}
          <rect
            x={0}
            y={0.5}
            width={slot}
            height={H - 1}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1.25}
            className={s.band({ kind: "selected" })}
            style={{ transform: `translateX(${left(selected.min)}px) scaleX(${selected.max - selected.min + 1})` }}
          />
          <line x1={0} y1={H} x2={W} y2={H} stroke="var(--ui-line)" strokeWidth={1} />
        </svg>
        {/* 손잡이 층 — 막대 영역을 덮고, 손잡이 밖은 아래 띠가 마우스를 받는다 */}
        <div ref={layerRef} className="pointer-events-none absolute inset-0">
          {handleRefs.map((ref, i) => (
            <div
              key={i}
              ref={ref}
              role="slider"
              tabIndex={0}
              aria-label={i === 0 ? "구간 손잡이 하나" : "구간 손잡이 둘"}
              aria-valuemin={axis.min}
              aria-valuemax={axis.max}
              aria-valuenow={i === 0 ? selected.min : selected.max}
              onKeyDown={onKeyDown(i)}
              className="group/handle pointer-events-auto absolute inset-y-0 left-0 -ml-2 flex w-4 cursor-ew-resize touch-none justify-center outline-none"
            >
              <span className="h-full w-px bg-accent" />
              <span className="absolute top-1/2 h-5 w-2 -translate-y-1/2 rounded-pill border border-accent bg-panel shadow-sm transition-transform group-hover/handle:scale-110 group-focus-visible/handle:ring-2 group-focus-visible/handle:ring-text" />
            </div>
          ))}
        </div>
      </div>
      {/* 가로축 숫자 — 양 끝은 안쪽으로 붙이고, 사이 눈금은 그 합계 칸의 가운데에 세운다 */}
      <div aria-hidden className="relative mt-1 h-3 text-pico tabular-nums text-muted">
        <span className="absolute left-0">{axis.min}</span>
        {TICKS.map((sum) => (
          <span key={sum} className="absolute -translate-x-1/2" style={{ left: `${((sum - axis.min + 0.5) / slots) * 100}%` }}>
            {sum}
          </span>
        ))}
        <span className="absolute right-0">{axis.max}</span>
      </div>
      <p className="mt-1 text-pico text-muted">가로축은 당첨 번호 6개의 합, 막대는 그 합이 나온 과거 회차 수입니다.</p>
      {frequentLegend || emptyLegend ? (
        <ul className="mt-3 space-y-1 text-nano leading-relaxed text-text">
          {frequentLegend ? (
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-4 shrink-0 rounded-[2px] bg-accent/15" />
              {frequentLegend}
              <Tooltip
                text="고른 구간과 같은 폭의 창을 21~255 에서 한 칸씩 밀며 과거 회차를 셌을 때 가장 많이 든 창의 90% 이상인 곳으로, 다음 추첨에 더 잘 나온다는 뜻은 아닙니다."
              />
            </li>
          ) : null}
          {emptyLegend ? (
            <li className="flex items-center gap-2">
              <svg aria-hidden viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 rounded-[2px]">
                <rect width={16} height={10} fill="url(#sum-range-hatch)" />
              </svg>
              {emptyLegend}
              <Tooltip text="센 회차에서 당첨 번호의 합으로 한 번도 나오지 않은 값이 고른 구간의 폭 이상 이어진 곳입니다." />
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
