import { NextResponse } from "next/server";
import { container } from "@/server/container";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await container.identity.getCurrentUser();
  const result = await container.deletePick(user.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result.value);
}
