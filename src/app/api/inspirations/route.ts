import { NextRequest, NextResponse } from "next/server";
import { getAllInspirations, createInspiration } from "@/lib/store-data";

export async function GET() {
  const inspirations = await getAllInspirations();
  return NextResponse.json(inspirations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const inspiration = await createInspiration(body);
  return NextResponse.json(inspiration, { status: 201 });
}