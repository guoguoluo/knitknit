"use client";

import { useState } from "react";
import { useTexts } from "@/lib/language";

export default function IconGeneratorPage() {
  const texts = useTexts();
  const [status, setStatus] = useState("");

  async function generateAndDownload(size: number) {
    setStatus(texts.iconGenerating(size));
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#9333EA");
    gradient.addColorStop(1, "#EC4899");
    ctx.fillStyle = gradient;
    const radius = size * 0.125;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = `${size * 0.5}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u{1F9F6}", size / 2, size / 2 + size * 0.03);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((createdBlob) => resolve(createdBlob!), "image/png")
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `icon-${size}x${size}.png`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(texts.iconDownloaded(size));
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-lg mx-auto mt-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{texts.iconPageTitle}</h1>
        <p className="text-gray-600 mb-6">
          {texts.iconPageDesc}
          <code className="bg-gray-100 px-1 rounded">{texts.iconPageDir}</code>
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => generateAndDownload(192)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
          >
            {texts.iconDownload192}
          </button>
          <button
            onClick={() => generateAndDownload(512)}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition"
          >
            {texts.iconDownload512}
          </button>
        </div>
        {status && <p className="mt-4 text-sm text-gray-500">{status}</p>}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <strong>{texts.iconHintTitle}</strong> {texts.iconHintBody}
        </div>
      </div>
    </div>
  );
}
