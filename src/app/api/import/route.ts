import { NextRequest, NextResponse } from "next/server";
import { importStore } from "@/lib/store-data";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.yarns || !data.inspirations || typeof data.nextYarnId !== "number" || typeof data.nextInspirationId !== "number") {
      return NextResponse.json({ error: "无效的数据格式" }, { status: 400 });
    }
    await importStore(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "导入失败" }, { status: 500 });
  }
}
