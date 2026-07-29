import { NextResponse } from "next/server";
import { container } from "@/server/container";

export async function GET() {
  const statistics = await container.getStatistics();
  return NextResponse.json(statistics);
}
