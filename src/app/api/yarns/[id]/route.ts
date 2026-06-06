import { NextRequest, NextResponse } from "next/server";
import { getYarnById, updateYarn, deleteYarn } from "@/lib/store-data";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const yarn = await getYarnById(Number(params.id));
  if (!yarn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(yarn);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const yarn = await updateYarn(Number(params.id), body);
  if (!yarn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(yarn);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteYarn(Number(params.id));
  return NextResponse.json({ success: true });
}