import { LOTTO_MAX } from "../../shared/combination";
import type { Draw } from "../../draw/domain/draw";

/** 번호별 출현 횟수 — index 0 = 번호 1 */
export function frequency(draws: readonly Draw[]): number[] {
  const counts = new Array<number>(LOTTO_MAX).fill(0);
  for (const draw of draws) {
    for (const n of draw.numbers) counts[n - 1] = (counts[n - 1] ?? 0) + 1;
  }
  return counts;
}

/** 회차별 6개 번호 합계 분포 — 합계값 → 출현 횟수 (희소 맵을 정렬 배열로) */
export function sumDistribution(draws: readonly Draw[]): { sum: number; count: number }[] {
  const map = new Map<number, number>();
  for (const draw of draws) {
    const s = draw.numbers.reduce((acc, n) => acc + n, 0);
    map.set(s, (map.get(s) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([sum, count]) => ({ sum, count }));
}

/** 홀수 개수(0~6) 분포 — index = 홀수 개수 */
export function oddCountDistribution(draws: readonly Draw[]): number[] {
  const dist = new Array<number>(7).fill(0);
  for (const draw of draws) {
    const odd = draw.numbers.filter((n) => n % 2 === 1).length;
    dist[odd] = (dist[odd] ?? 0) + 1;
  }
  return dist;
}

/** 저구간(1~22) 개수(0~6) 분포 — index = 저구간 번호 개수 */
export function lowCountDistribution(draws: readonly Draw[]): number[] {
  const dist = new Array<number>(7).fill(0);
  for (const draw of draws) {
    const low = draw.numbers.filter((n) => n <= 22).length;
    dist[low] = (dist[low] ?? 0) + 1;
  }
  return dist;
}

/** 구간별(1-10 · 11-20 · 21-30 · 31-40 · 41-45) 총 출현 횟수 */
export function zoneCounts(draws: readonly Draw[]): number[] {
  const zones = new Array<number>(5).fill(0);
  for (const draw of draws) {
    for (const n of draw.numbers) {
      const zone = Math.min(4, Math.floor((n - 1) / 10));
      zones[zone] = (zones[zone] ?? 0) + 1;
    }
  }
  return zones;
}

/** 번호별 미출현 기간 — 최신 회차 기준 몇 회째 안 나왔는지 (0 = 최신 회차에 출현) */
export function hotCold(
  draws: readonly Draw[],
): { number: number; count: number; gap: number }[] {
  const freq = frequency(draws);
  const lastSeen = new Array<number>(LOTTO_MAX).fill(0); // 0 = 한 번도 안 나옴
  for (const draw of draws) {
    for (const n of draw.numbers) lastSeen[n - 1] = draw.round;
  }
  const latestRound = draws.length > 0 ? (draws[draws.length - 1]?.round ?? 0) : 0;
  return Array.from({ length: LOTTO_MAX }, (_, i) => ({
    number: i + 1,
    count: freq[i] ?? 0,
    gap: lastSeen[i] === 0 ? latestRound : latestRound - (lastSeen[i] ?? 0),
  }));
}

/** 동시 출현 페어 상위 topN — 함께 나온 번호쌍의 횟수 */
export function topPairs(
  draws: readonly Draw[],
  topN: number,
): { a: number; b: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const draw of draws) {
    const ns = draw.numbers;
    for (let i = 0; i < ns.length; i += 1) {
      for (let j = i + 1; j < ns.length; j += 1) {
        const key = (ns[i] as number) * 100 + (ns[j] as number);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1] || x[0] - y[0])
    .slice(0, topN)
    .map(([key, count]) => ({ a: Math.floor(key / 100), b: key % 100, count }));
}
