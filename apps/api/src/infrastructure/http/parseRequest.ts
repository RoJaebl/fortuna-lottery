import type { z } from "zod";
import { MALFORMED_REQUEST, RequestRejected } from "./RequestRejected.js";

/** 요청 본문을 계약 스키마로 검사한다. 모양이 틀리면 클라이언트 잘못이므로 거절(400)로 올린다 — 응답 검사는 이것을 쓰지 않는다 */
export function parseRequest<S extends z.ZodType>(schema: S, raw: unknown): z.infer<S> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new RequestRejected(MALFORMED_REQUEST);
  return parsed.data;
}
