import { afterAll, describe, expect, it } from "vitest";
import { DummyDrawDataAdapter } from "../adapter/DummyDrawDataAdapter.js";
import { PrismaDrawDataAdapter } from "../adapter/PrismaDrawDataAdapter.js";
import { PrismaService } from "../../../../infrastructure/prisma/PrismaService.js";
import type { DrawDataPort } from "./DrawDataPort.js";

/** DrawDataPort 계약 — 어느 어댑터든 같은 시험을 통과해야 바꿔 끼울 수 있다 */
function drawDataPortContract(name: string, create: () => DrawDataPort, skip = false) {
  describe.skipIf(skip)(`DrawDataPort 계약 — ${name}`, () => {
    it("회차 오름차순으로 돌려준다", async () => {
      const draws = await create().getAllDraws();
      const rounds = draws.map((d) => d.round);
      expect(rounds).toEqual([...rounds].sort((a, b) => a - b));
    });

    it("모든 회차의 numbers 는 6 개다", async () => {
      const draws = await create().getAllDraws();
      for (const d of draws) expect(d.numbers).toHaveLength(6);
    });
  });
}

drawDataPortContract("DummyDrawDataAdapter", () => new DummyDrawDataAdapter({ rounds: 50, seed: 1 }));

// Prisma 쪽은 DATABASE_URL 이 있을 때만 돈다(없으면 skip)
const hasDatabase = Boolean(process.env.DATABASE_URL);
const prisma = hasDatabase ? new PrismaService() : null;
drawDataPortContract(
  "PrismaDrawDataAdapter",
  () => new PrismaDrawDataAdapter(prisma as PrismaService),
  !hasDatabase,
);
afterAll(async () => {
  await prisma?.$disconnect();
});
