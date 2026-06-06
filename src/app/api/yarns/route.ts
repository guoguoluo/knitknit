import { NextRequest, NextResponse } from "next/server";
import { getAllYarns, createYarn } from "@/lib/store-data";

export async function GET() {
  const yarns = await getAllYarns();
  return NextResponse.json(yarns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const yarn = await createYarn(body);
  return NextResponse.json(yarn, { status: 201 });
}