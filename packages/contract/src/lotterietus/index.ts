import type { z } from "zod";
import type {
  LotterietusDrawSchema,
  LotterietusReadResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type LotterietusDraw = z.infer<typeof LotterietusDrawSchema>;
export type LotterietusReadResponse = z.infer<typeof LotterietusReadResponseSchema>;
