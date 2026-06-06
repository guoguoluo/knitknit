import { NextResponse } from "next/server";
import { getFullStore } from "@/lib/store-data";

export async function GET() {
  const store = await getFullStore();
  const json = JSON.stringify(store, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=yarn-store.json",
    },
  });
}
