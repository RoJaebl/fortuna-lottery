import { NextResponse } from "next/server";
import { container } from "@/server/container";

export async function GET() {
  const user = await container.identity.getCurrentUser();
  const results = await container.checkResults(user.id);
  return NextResponse.json(results);
}
