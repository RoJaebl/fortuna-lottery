import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest } from "@fortuna-lottery/core/generator/dto";
import { container } from "@/server/container";

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }
  const result = container.generateCombination(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.value);
}
