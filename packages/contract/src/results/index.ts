import type { z } from "zod";
import type {
  ResultsCheckItemSchema,
  ResultsCheckResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type ResultsCheckItem = z.infer<typeof ResultsCheckItemSchema>;
export type ResultsCheckResponse = z.infer<typeof ResultsCheckResponseSchema>;
