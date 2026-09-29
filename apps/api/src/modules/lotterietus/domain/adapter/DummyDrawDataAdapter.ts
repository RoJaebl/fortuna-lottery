import { LOTTO_MAX, LOTTO_PICK_COUNT, mulberry32 } from "@fortuna-lottery/kernel";
import type { Draw } from "../model/Draw.model.js";
import type { DrawDataPort } from "../port/DrawDataPort.js";

export interface DummyDrawDataOptions {
  /** 생성할 회차 수 (기본 1182 — 2002-12-07 1회차 기준 현재 추정치) */
  rounds?: number;
  /** PRNG 시드 — 같은 시드는 항상 같은 데이터를 만든다 (결정적) */
  seed?: number;
}

const FIRST_DRAW_UTC = Date.UTC(2002, 11, 7, 11, 35); // 2002-12-07 20:35 KST
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 더미 회차 데이터 어댑터 — 시드 고정 결정적 생성. 시험과 시드 용도의 대체 구현이다.
 * DrawDataPort 뒤이므로 Prisma 어댑터와 바꿔 끼워도 유스케이스·도메인은 무수정이다.
 */
export class DummyDrawDataAdapter implements DrawDataPort {
  private readonly rounds: number;
  private readonly seed: number;
  private cache: readonly Draw[] | null = null;

  constructor({ rounds = 1182, seed = 20021207 }: DummyDrawDataOptions = {}) {
    this.rounds = rounds;
    this.seed = seed;
  }

  getAllDraws = async (): Promise<readonly Draw[]> => {
    this.cache ??= this.generate();
    return this.cache;
  };

  private generate(): readonly Draw[] {
    const random = mulberry32(this.seed);
    const draws: Draw[] = [];
    for (let round = 1; round <= this.rounds; round += 1) {
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
  }
}
