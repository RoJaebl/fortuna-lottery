import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

export const PicksCreateRequestSchema = z.object({
  numbers: combinationSchema,
});

export const PicksItemSchema = z.object({
  id: z.string(),
  numbers: combinationSchema,
  createdAt: z.string(),
});

export const PicksListResponseSchema = z.array(PicksItemSchema);

/** 저장 응답 — 저장된 픽 하나 */
export const PicksCreateResponseSchema = PicksItemSchema;

/** 삭제 응답 */
export const PicksDeleteResponseSchema = z.object({
  deleted: z.literal(true),
});
