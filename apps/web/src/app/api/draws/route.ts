import { NextRequest, NextResponse } from "next/server";
import { container } from "@/server/container";

export async function GET(request: NextRequest) {
  const count = Number(request.nextUrl.searchParams.get("count") ?? "5");
  const draws = await container.getRecentDraws(Number.isFinite(count) ? count : 5);
  return NextResponse.json(draws);
}
