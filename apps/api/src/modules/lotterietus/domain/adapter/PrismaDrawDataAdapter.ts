import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/PrismaService.js";
import type { Draw } from "../model/Draw.model.js";
import { drawnAtFromDate } from "../model/drawnAt.js";
import type { DrawDataPort } from "../port/DrawDataPort.js";

/**
 * draws 테이블 읽기 어댑터.
 * DrawDataPort 규약대로 회차 오름차순으로 반환한다 (마지막 원소 = 최신 회차).
 */
@Injectable()
export class PrismaDrawDataAdapter implements DrawDataPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getAllDraws = async (): Promise<readonly Draw[]> => {
    const rows = await this.prisma.draw.findMany({ orderBy: { round: "asc" } });
    return rows.map(
      (row): Draw => ({
        round: row.round,
        numbers: Object.freeze([row.n1, row.n2, row.n3, row.n4, row.n5, row.n6]),
        bonus: row.bonus,
        drawnAt: drawnAtFromDate(row.drawnAt),
      }),
    );
  };
}
