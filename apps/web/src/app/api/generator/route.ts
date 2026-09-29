import { NextRequest, NextResponse } from "next/server";
import type { GeneratorGenerateRequest } from "@fortuna-lottery/contract/generator";
import { container } from "@/server/container";

export async function POST(request: NextRequest) {
  let body: GeneratorGenerateRequest;
  try {
    body = (await request.json()) as GeneratorGenerateRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }
  const result = container.generateCombination(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.value);
}
