import { PrismaClient } from "@prisma/client";

export type { PrismaClient };

/**
 * PrismaClient 생성 — 앱(웹/워커)이 Prisma에 직접 의존하지 않도록 core가 유일한 진입점을 제공한다.
 * 생성된 클라이언트는 packages/core/node_modules 아래에 있으므로 core에서만 해석된다.
 * 호출한 쪽이 수명(필요 시 `$disconnect()`)을 책임진다.
 */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}
