import type { z } from "zod";
import type {
  PicksCreateRequestSchema,
  PicksCreateResponseSchema,
  PicksDeleteResponseSchema,
  PicksItemSchema,
  PicksListResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type PicksCreateRequest = z.infer<typeof PicksCreateRequestSchema>;
export type PicksItem = z.infer<typeof PicksItemSchema>;
export type PicksListResponse = z.infer<typeof PicksListResponseSchema>;
export type PicksCreateResponse = z.infer<typeof PicksCreateResponseSchema>;
export type PicksDeleteResponse = z.infer<typeof PicksDeleteResponseSchema>;
