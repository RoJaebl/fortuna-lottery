import { NextResponse } from "next/server";
import { container } from "@/server/container";

export async function GET() {
  const countdown = await container.getCountdown();
  return NextResponse.json(countdown);
}
