"use client";
import { useRef, type KeyboardEvent } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Draggable, useGSAP);

export interface RoundTimelineProps {
  /** 재생 위치 점이 선 회차 위치(0 부터) */
  position: number;
  /** 재생 위치가 설 수 있는 가장 앞자리 — 끝에서 재생을 누르면 여기부터 다시 돈다 */
  minPosition: number;
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
  /** 재생 배속 — 1 배속이면 한 회차에 0.1 초 머문다 */
  speed: number;
  /** 고를 수 있는 배속 */
  speeds: readonly number[];
  onSpeedChange: (speed: number) => void;
}

/** 화살표 키 한 번에 옮기는 회차 수 */
const STEP = 10;

/** 1 배속으로 재생할 때 한 회차에 머무는 시간(초) */
const SECONDS_PER_ROUND = 0.1;

/**
 * 동영상 재생 바처럼 생긴 회차 타임라인 — 처음부터 재생 위치까지 채우고, 그 끝의 점을 GSAP Draggable 로 끈다.
 * 바 위에 마우스를 올리면 그 자리의 회차를 띄우고, 클릭하면 그 회차를 고른다.
 * 왼쪽 재생 단추는 지금 위치부터 다음 회차로 차례로 넘긴다 — 손으로 옮기면 멈춘다
 */
export function RoundTimeline({
  position,
  minPosition,
  total,
  roundAt,
  onSeek,
  page,
  label,
  valueText,
  speed,
  speeds,
  onSpeedChange,
}: RoundTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<Draggable | null>(null);
  const playRef = useRef<gsap.core.Tween | null>(null);
  // Draggable·재생 트윈은 한 번 짓고 최신 값은 ref 로 읽는다
  const latest = useRef({ position, minPosition, total, roundAt, onSeek, speed });
  latest.current = { position, minPosition, total, roundAt, onSeek, speed };

  /** 재생 중인지를 단추에 적는다 — 화면은 상태를 갖지 않으므로 DOM 에 바로 쓴다 */
  const markPlaying = (playing: boolean) => {
    const button = playButtonRef.current;
    if (!button) return;
    button.dataset.playing = String(playing);
    button.setAttribute("aria-label", playing ? "일시정지" : "재생");
  };

  const stop = () => {
    playRef.current?.kill();
    playRef.current = null;
    markPlaying(false);
  };

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

  const { contextSafe } = useGSAP(() => {
    if (!headRef.current || !trackRef.current) return;
    dragRef.current = Draggable.create(headRef.current, {
      type: "x",
      onPress() {
        stop();
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
      // 재생 중에는 0.1 초마다 위치가 바뀌므로 앞선 미끄러짐을 이어받아 덮는다
      duration: playRef.current ? SECONDS_PER_ROUND / speed : 0.3,
      ease: playRef.current ? "none" : "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        syncPlayed();
        dragRef.current?.update();
      },
    });
  }, [position, total]);

  // 재생 중에 배속을 바꾸면 남은 재생이 그 배속으로 이어진다
  useGSAP(() => {
    playRef.current?.timeScale(speed);
  }, [speed]);

  /** 지금 위치부터 마지막 회차까지 한 회차씩 넘긴다. 끝에 있으면 가장 앞자리부터 다시 돈다. 재생 중이면 멈춘다 */
  const togglePlay = contextSafe(() => {
    if (playRef.current) return stop();
    const { position: now, minPosition: first, total: count } = latest.current;
    const last = count - 1;
    const from = now >= last ? first : now;
    if (from >= last) return;
    if (from !== now) latest.current.onSeek(from);
    const proxy = { at: from };
    let shown = from;
    playRef.current = gsap.to(proxy, {
      at: last,
      duration: (last - from) * SECONDS_PER_ROUND,
      ease: "none",
      onUpdate: () => {
        const next = Math.floor(proxy.at);
        if (next === shown) return;
        shown = next;
        latest.current.onSeek(next);
      },
      onComplete: () => {
        latest.current.onSeek(last);
        stop();
      },
    }).timeScale(latest.current.speed);
    markPlaying(true);
  });

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
    stop();
    onSeek(Math.min(Math.max(0, next), total - 1));
  };

  return (
    <div className="flex items-start gap-3">
      <button
        ref={playButtonRef}
        type="button"
        aria-label="재생"
        data-playing="false"
        onClick={togglePlay}
        className="group/play -mt-1 flex size-6 shrink-0 items-center justify-center rounded-pill bg-accent text-on-strong outline-none focus-visible:ring-2 focus-visible:ring-text"
      >
        {/* 재생 중이 아니면 ▶, 재생 중이면 ❚❚ */}
        <svg viewBox="0 0 12 12" className="size-3 group-data-[playing=true]/play:hidden" aria-hidden>
          <path d="M3 1.5v9l7.5-4.5z" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 12 12" className="hidden size-3 group-data-[playing=true]/play:block" aria-hidden>
          <rect x="2.5" y="1.5" width="2.5" height="9" rx="0.5" fill="currentColor" />
          <rect x="7" y="1.5" width="2.5" height="9" rx="0.5" fill="currentColor" />
        </svg>
      </button>
      <select
        aria-label="재생 속도"
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        className="-mt-1 h-6 shrink-0 rounded-button border border-line bg-panel px-1 text-nano tabular-nums text-muted outline-none focus-visible:ring-2 focus-visible:ring-text"
      >
        {speeds.map((s) => (
          <option key={s} value={s}>
            {s}배속
          </option>
        ))}
      </select>
      <div className="min-w-0 flex-1">
        <div
          ref={trackRef}
          className="group relative h-4 cursor-pointer"
          onPointerMove={(e) => showTip(pointerX(e))}
          onPointerLeave={hideTip}
          onClick={(e) => {
            stop();
            onSeek(indexAt(pointerX(e)));
          }}
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
        <div className="mt-1 flex justify-between text-pico tabular-nums text-muted">
          <span>제{roundAt(0)}회</span>
          <span>제{roundAt(total - 1)}회</span>
        </div>
      </div>
    </div>
  );
}
