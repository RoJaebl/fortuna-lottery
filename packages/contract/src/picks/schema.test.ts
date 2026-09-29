import { describe, expect, it } from "vitest";
import { PicksItemSchema, PicksListResponseSchema, PicksSaveRequestSchema } from "./schema.js";

const save = (numbers: number[]) => PicksSaveRequestSchema.safeParse({ numbers }).success;
const item = (numbers: number[]) =>
  PicksItemSchema.safeParse({ id: "a", numbers, createdAt: "2026-01-01T00:00:00Z" }).success;

describe.each([
  ["PicksSaveRequestSchema", save],
  ["PicksItemSchema", item],
])("%s", (_name, parse) => {
  it("유효한 조합을 통과시킨다", () => {
    expect(parse([1, 2, 3, 4, 5, 6])).toBe(true);
  });
  it("원소 7개를 거부한다", () => {
    expect(parse([1, 2, 3, 4, 5, 6, 7])).toBe(false);
  });
  it("46 이 섞인 조합을 거부한다", () => {
    expect(parse([1, 2, 3, 4, 5, 46])).toBe(false);
  });
  it("중복을 거부한다", () => {
    expect(parse([1, 1, 2, 3, 4, 5])).toBe(false);
  });
});

describe("PicksListResponseSchema", () => {
  it("PicksItem 배열이다", () => {
    const one = (numbers: number[]) => ({ id: "a", numbers, createdAt: "2026-01-01T00:00:00Z" });
    expect(PicksListResponseSchema.safeParse([one([1, 2, 3, 4, 5, 6])]).success).toBe(true);
    expect(PicksListResponseSchema.safeParse([one([1, 1, 2, 3, 4, 5])]).success).toBe(false);
  });
});
