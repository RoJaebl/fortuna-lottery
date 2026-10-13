import type { z } from "zod";
import type {
  GeneratorGenerateRequestSchema,
  GeneratorGenerateResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type GeneratorGenerateRequest = z.infer<typeof GeneratorGenerateRequestSchema>;
export type GeneratorGenerateResponse = z.infer<typeof GeneratorGenerateResponseSchema>;
