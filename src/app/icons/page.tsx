"use client";

import { useState } from "react";

export default function IconGeneratorPage() {
  const [status, setStatus] = useState("");

  async function generateAndDownload(size: number) {
    setStatus(`正在生成 ${size}x${size}...`);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#9333EA");
    gradient.addColorStop(1, "#EC4899");
    ctx.fillStyle = gradient;
    const r = size * 0.125;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = `${size * 0.5}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧶", size / 2, size / 2 + size * 0.03);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icon-${size}x${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`${size}x${size} 已下载！`);
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
    <div className="max-w-lg mx-auto mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">PWA 图标生成器</h1>
      <p className="text-gray-600 mb-6">
        点击下方按钮下载 PNG 图标，然后放入 <code className="bg-gray-100 px-1 rounded">public/icons/</code> 目录
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => generateAndDownload(192)}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
        >
          下载 192x192
        </button>
        <button
          onClick={() => generateAndDownload(512)}
          className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition"
        >
          下载 512x512
        </button>
      </div>
      {status && <p className="mt-4 text-sm text-gray-500">{status}</p>}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <strong>提示：</strong>下载后将文件放到 <code>public/icons/</code> 目录，然后更新 <code>manifest.json</code>
      </div>
    </div>
    </div>
  );
}