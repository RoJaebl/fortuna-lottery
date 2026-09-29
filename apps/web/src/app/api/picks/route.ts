import { NextRequest, NextResponse } from "next/server";
import type { PicksSaveRequest } from "@fortuna-lottery/contract/picks";
import { container } from "@/server/container";

export async function GET() {
  const user = await container.identity.getCurrentUser();
  const picks = await container.listPicks(user.id);
  return NextResponse.json(picks);
}

export async function POST(request: NextRequest) {
  const user = await container.identity.getCurrentUser();
  let body: PicksSaveRequest;
  try {
    body = (await request.json()) as PicksSaveRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }
  const result = await container.savePick(user.id, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.value, { status: 201 });
}
