import { NextRequest, NextResponse } from "next/server";
import type { SimulationBacktestRequest } from "@fortuna-lottery/contract/simulation";
import { container } from "@/server/container";

export async function POST(request: NextRequest) {
  let body: SimulationBacktestRequest;
  try {
    body = (await request.json()) as SimulationBacktestRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }
  const result = await container.backtestCombination(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.value);
}
