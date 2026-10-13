// 사례: 유스케이스가 PrismaClient 를 직접 가져왔다 — DB 드라이버는 어댑터에서만 쓴다.
import { PrismaClient } from '@prisma/client'
export const d = PrismaClient
