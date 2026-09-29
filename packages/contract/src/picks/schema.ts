import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

export const PicksSaveRequestSchema = z.object({
  numbers: combinationSchema,
});
export type PicksSaveRequest = z.infer<typeof PicksSaveRequestSchema>;

export const PicksItemSchema = z.object({
  id: z.string(),
  numbers: combinationSchema,
  createdAt: z.string(),
});
export type PicksItem = z.infer<typeof PicksItemSchema>;

export const PicksListResponseSchema = z.array(PicksItemSchema);
export type PicksListResponse = z.infer<typeof PicksListResponseSchema>;
