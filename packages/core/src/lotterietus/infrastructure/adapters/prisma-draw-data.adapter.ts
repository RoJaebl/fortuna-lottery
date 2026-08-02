import type { PrismaClient } from "@prisma/client";
import type { DrawDataPort } from "../../application/ports/draw-data.port";
import type { Draw } from "../../domain/draw";
import { drawnAtFromDate } from "../../domain/drawn-at";

/**
 * draws 테이블 읽기 어댑터 — DummyDrawDataAdapter를 대체한다.
 * DrawDataPort 규약대로 회차 오름차순으로 반환한다 (마지막 원소 = 최신 회차).
 */
export function createPrismaDrawDataAdapter(prisma: PrismaClient): DrawDataPort {
  return {
    async getAllDraws() {
      const rows = await prisma.draw.findMany({ orderBy: { round: "asc" } });
      return rows.map(
        (row): Draw => ({
          round: row.round,
          numbers: Object.freeze([row.n1, row.n2, row.n3, row.n4, row.n5, row.n6]),
          bonus: row.bonus,
          drawnAt: drawnAtFromDate(row.drawnAt),
        }),
      );
    },
  };
}
