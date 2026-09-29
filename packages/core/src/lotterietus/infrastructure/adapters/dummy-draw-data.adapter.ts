import { LOTTO_MAX, LOTTO_PICK_COUNT } from "@fortuna-lottery/kernel";
import { mulberry32 } from "@fortuna-lottery/kernel";
import type { Draw } from "../../domain/draw";
import type { DrawDataPort } from "../../application/ports/draw-data.port";

export interface DummyDrawDataOptions {
  /** 생성할 회차 수 (기본 1182 — 2002-12-07 1회차 기준 현재 추정치) */
  rounds?: number;
  /** PRNG 시드 — 같은 시드는 항상 같은 데이터를 만든다 (결정적) */
  seed?: number;
}

const FIRST_DRAW_UTC = Date.UTC(2002, 11, 7, 11, 35); // 2002-12-07 20:35 KST
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 더미 회차 데이터 어댑터 — 시드 고정 결정적 생성.
 * 후속 단계에서 RealDrawDataAdapter(동행복권 등)로 교체해도
 * DrawDataPort 뒤이므로 유스케이스·도메인은 무수정이다.
 */
export function createDummyDrawDataAdapter(options: DummyDrawDataOptions = {}): DrawDataPort {
  const { rounds = 1182, seed = 20021207 } = options;
  let cache: readonly Draw[] | null = null;

  const generate = (): readonly Draw[] => {
    const random = mulberry32(seed);
    const draws: Draw[] = [];
    for (let round = 1; round <= rounds; round += 1) {
      // 1~45 풀에서 부분 Fisher-Yates로 7개(6 + 보너스) 추출
      const pool = Array.from({ length: LOTTO_MAX }, (_, i) => i + 1);
      for (let i = 0; i < LOTTO_PICK_COUNT + 1; i += 1) {
        const j = i + Math.floor(random() * (pool.length - i));
        const tmp = pool[i] as number;
        pool[i] = pool[j] as number;
        pool[j] = tmp;
      }
      const numbers = pool.slice(0, LOTTO_PICK_COUNT).sort((a, b) => a - b);
      const bonus = pool[LOTTO_PICK_COUNT] as number;
      draws.push({
        round,
        numbers: Object.freeze(numbers),
        bonus,
        drawnAt: new Date(FIRST_DRAW_UTC + (round - 1) * WEEK_MS).toISOString(),
      });
    }
    return Object.freeze(draws);
  };

  return {
    async getAllDraws() {
      cache ??= generate();
      return cache;
    },
  };
}
