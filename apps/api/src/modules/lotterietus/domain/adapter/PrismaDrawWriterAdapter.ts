import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/prisma/PrismaService.js";
import type { Draw } from "../model/Draw.model.js";
import type { DrawWriterPort } from "../port/DrawWriterPort.js";

function toRow(draw: Draw) {
  const [n1, n2, n3, n4, n5, n6] = draw.numbers;
  if (
    n1 === undefined ||
    n2 === undefined ||
    n3 === undefined ||
    n4 === undefined ||
    n5 === undefined ||
    n6 === undefined
  ) {
    throw new Error(`회차 ${draw.round}의 번호가 6개가 아닙니다: ${draw.numbers.length}개`);
  }
  return {
    round: draw.round,
    n1,
    n2,
    n3,
    n4,
    n5,
    n6,
    bonus: draw.bonus,
    // @db.Date 컬럼이라 날짜만 저장된다 — 읽을 때 drawnAtFromDate가 추첨 시각을 복원한다
    drawnAt: new Date(draw.drawnAt),
  };
}

/** draws 테이블 쓰기 어댑터 — 회차 PK 기준 멱등(upsert) */
@Injectable()
export class PrismaDrawWriterAdapter implements DrawWriterPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getMaxRound = async (): Promise<number> => {
    const { _max } = await this.prisma.draw.aggregate({ _max: { round: true } });
    return _max.round ?? 0;
  };

  upsertDraws = async (draws: readonly Draw[]): Promise<void> => {
    if (draws.length === 0) return;
    const rows = draws.map(toRow);
    await this.prisma.$transaction(
      rows.map((row) => this.prisma.draw.upsert({ where: { round: row.round }, create: row, update: row })),
    );
  };
}
