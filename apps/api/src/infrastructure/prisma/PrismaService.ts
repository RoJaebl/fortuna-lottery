import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/** 서비스에 연결 하나 — 여러 모듈의 어댑터가 이것을 함께 딛는다. 접속 주소는 스키마의 DATABASE_URL 이다 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
