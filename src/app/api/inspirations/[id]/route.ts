import { NextRequest, NextResponse } from "next/server";
import { getInspirationById, updateInspiration, deleteInspiration } from "@/lib/store-data";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const insp = await getInspirationById(Number(params.id));
  if (!insp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insp);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const insp = await updateInspiration(Number(params.id), body);
  if (!insp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insp);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteInspiration(Number(params.id));
  return NextResponse.json({ success: true });
}