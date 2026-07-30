import { NextResponse } from "next/server";
import { container } from "@/server/container";

export async function GET() {
  const status = await container.getLotterietusStatus();
  return NextResponse.json(status);
}
