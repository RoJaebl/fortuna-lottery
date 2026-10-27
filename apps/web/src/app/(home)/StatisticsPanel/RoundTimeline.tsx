"use client";
import { useRef, type KeyboardEvent } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Draggable, useGSAP);

export interface RoundTimelineProps {
  /** 재생 위치 점이 선 회차 위치(0 부터) */
  position: number;
  /** 전 회차 수 */
  total: number;
  /** 위치(0 부터) → 회차 번호 */
  roundAt: (index: number) => number;
  /** 그 위치의 회차를 고른다 — 클릭·끌기·키보드가 모두 이것을 부른다 */
  onSeek: (index: number) => void;
  /** PageUp/PageDown 한 번에 옮기는 회차 수 */
  page: number;
  /** 손잡이의 이름과 지금 값의 문구(보조 기술용) */
  label: string;
  valueText: string;
}

/** 화살표 키 한 번에 옮기는 회차 수 */
const STEP = 10;

/**
 * 동영상 재생 바처럼 생긴 회차 타임라인 — 처음부터 재생 위치까지 채우고, 그 끝의 점을 GSAP Draggable 로 끈다.
 * 바 위에 마우스를 올리면 그 자리의 회차를 띄우고, 클릭하면 그 회차를 고른다
 */
export function RoundTimeline({ position, total, roundAt, onSeek, page, label, valueText }: RoundTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Draggable | null>(null);
  // Draggable 은 한 번만 짓고 최신 값은 ref 로 읽는다
  const latest = useRef({ total, roundAt, onSeek });
  latest.current = { total, roundAt, onSeek };

  const width = () => trackRef.current?.clientWidth ?? 0;

  /** 바 위의 x(px) → 회차 위치(0 부터) */
  const indexAt = (x: number) => {
    const room = width();
    const last = latest.current.total - 1;
    return room > 0 ? Math.round(Math.min(Math.max(x / room, 0), 1) * last) : last;
  };

  /** 마우스·손잡이가 가리키는 자리 위에 「제N회」를 띄운다 — 상태 없이 DOM 에 바로 쓴다 */
  const showTip = (x: number) => {
    const tip = tipRef.current;
    if (!tip) return;
    tip.textContent = `제${latest.current.roundAt(indexAt(x))}회`;
    tip.style.left = `${Math.min(Math.max(x, 0), width())}px`;
    tip.style.opacity = "1";
  };
  const hideTip = () => {
    if (tipRef.current && !dragRef.current?.isDragging) tipRef.current.style.opacity = "0";
  };

  // 재생된 막대는 재생 위치 점을 따라간다
  const syncPlayed = () => {
    if (playedRef.current && headRef.current) playedRef.current.style.width = `${gsap.getProperty(headRef.current, "x")}px`;
  };

  useGSAP(() => {
    if (!headRef.current || !trackRef.current) return;
    dragRef.current = Draggable.create(headRef.current, {
      type: "x",
      onPress() {
        this.applyBounds({ minX: 0, maxX: width() });
      },
      onDrag() {
        syncPlayed();
        showTip(this.x);
        latest.current.onSeek(indexAt(this.x));
      },
      onRelease: hideTip,
    })[0] ?? null;
  }, []);

  // 위치가 바뀌면 재생 위치 점을 그 자리로 미끄러뜨린다. 끄는 동안은 손이 자리를 정한다
  useGSAP(() => {
    if (!headRef.current || dragRef.current?.isDragging) return;
    const x = total > 1 ? (position / (total - 1)) * width() : 0;
    gsap.to(headRef.current, {
      x,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        syncPlayed();
        dragRef.current?.update();
      },
    });
  }, [position, total]);

  const pointerX = (e: { clientX: number }) => e.clientX - (trackRef.current?.getBoundingClientRect().left ?? 0);

  const onKeyDown = (e: KeyboardEvent) => {
    const next = {
      ArrowLeft: position - STEP,
      ArrowRight: position + STEP,
      PageUp: position - page,
      PageDown: position + page,
      Home: 0,
      End: total - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onSeek(Math.min(Math.max(0, next), total - 1));
  };

  return (
    <div>
      <div
        ref={trackRef}
        className="group relative h-4 cursor-pointer"
        onPointerMove={(e) => showTip(pointerX(e))}
        onPointerLeave={hideTip}
        onClick={(e) => onSeek(indexAt(pointerX(e)))}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-line transition-[height] group-hover:h-1.5" />
        <div
          ref={playedRef}
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-accent transition-[height] group-hover:h-1.5"
        />
        <div
          ref={headRef}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={total - 1}
          aria-valuenow={position}
          aria-valuetext={valueText}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="absolute -left-1.5 top-1/2 -mt-1.5 size-3 cursor-grab rounded-pill bg-accent shadow outline-none transition-transform group-hover:scale-125 focus-visible:ring-2 focus-visible:ring-text active:cursor-grabbing"
        />
        <div
          ref={tipRef}
          aria-hidden
          className="pointer-events-none absolute bottom-full mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-button bg-text px-1.5 py-0.5 text-nano tabular-nums text-on-strong opacity-0 transition-opacity"
        />
      </div>
      <div className="mt-1 flex justify-between text-nano tabular-nums text-muted">
        <span>제{roundAt(0)}회</span>
        <span>제{roundAt(total - 1)}회</span>
      </div>
    </div>
  );
}
