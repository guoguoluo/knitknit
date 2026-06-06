import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getUploadDir(): string {
  const envPath = process.env.YARN_UPLOADS_PATH;
  if (envPath) return envPath;
  return path.join(process.cwd(), "public", "uploads");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
  if (!ext || !allowed.includes(ext)) {
    return NextResponse.json({ error: "Only jpg/png/gif/webp/pdf allowed" }, { status: 400 });
  }
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}