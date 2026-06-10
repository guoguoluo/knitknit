"use client";
import { useState, useRef } from "react";
import { useYarnStore } from "@/lib/store";

interface Props {
  onClose: () => void;
  initial?: { id: number; name: string; brand: string; color: string; material: string; weight: string; quantity: number; unit: string; notes: string; photo: string; tags: string[]; colors: string[] };
}

const KNOWN_MATERIALS = ["羊毛", "棉", "亚麻", "丝", "羊绒", "马海毛", "腈纶", "尼龙", "竹纤维", "羊驼毛", "美利奴", "真丝"];

function removeBackground(img: HTMLImageElement): string {
  const cw = 400;
  const ch = Math.round((img.naturalHeight / img.naturalWidth) * cw);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, cw, ch);
  const { data, width, height } = ctx.getImageData(0, 0, cw, ch);

  const visited = new Uint8Array(width * height);
  const isBg: number[] = [];

  const samplePixels: number[] = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < width; x += 4) {
      samplePixels.push(y * width + x);
    }
  }
  for (let x = 0; x < width; x += 4) {
    samplePixels.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 4) {
    samplePixels.push(y * width);
    samplePixels.push(y * width + width - 1);
  }

  let rAcc = 0, gAcc = 0, bAcc = 0, cnt = 0;
  for (const idx of samplePixels) {
    const i = idx * 4;
    rAcc += data[i]; gAcc += data[i + 1]; bAcc += data[i + 2];
    cnt++;
  }
  const bgR = rAcc / cnt, bgG = gAcc / cnt, bgB = bAcc / cnt;
  const threshold = 55;

  const stack: number[] = [];
  for (const idx of samplePixels) {
    if (!visited[idx]) {
      visited[idx] = 1;
      stack.push(idx);
    }
  }
  while (stack.length) {
    const idx = stack.pop()!;
    const i = idx * 4;
    const dr = data[i] - bgR, dg = data[i + 1] - bgG, db = data[i + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < threshold) {
      isBg.push(idx);
      data[i + 3] = 0;
      const x = idx % width, y = Math.floor(idx / width);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = ny * width + nx;
          if (!visited[ni]) { visited[ni] = 1; stack.push(ni); }
        }
      }
    }
  }
  ctx.putImageData(ctx.getImageData(0, 0, cw, ch), 0, 0);
  return canvas.toDataURL("image/png");
}

function extractDominantColors(img: HTMLImageElement): string[] {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 100, 100);
  const { data } = ctx.getImageData(0, 0, 100, 100);
  const colorMap = new Map<string, number>();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue;
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color);
}

function inferMaterialFromName(name: string, brand: string): string {
  const text = `${name} ${brand}`.toLowerCase();
  for (const m of KNOWN_MATERIALS) {
    if (text.includes(m)) return m;
  }
  if (text.includes("wool") || text.includes("merino")) return "羊毛";
  if (text.includes("cotton")) return "棉";
  if (text.includes("silk")) return "丝";
  if (text.includes("linen")) return "亚麻";
  if (text.includes("alpaca")) return "羊驼毛";
  if (text.includes("mohair")) return "马海毛";
  if (text.includes("acrylic")) return "腈纶";
  if (text.includes("nylon")) return "尼龙";
  return "";
}

export default function YarnForm({ onClose, initial }: Props) {
  const { createYarn, updateYarn } = useYarnStore();
  const [name, setName] = useState(initial?.name || "");
  const [brand, setBrand] = useState(initial?.brand || "");
  const [color, setColor] = useState(initial?.color || "");
  const [colors, setColors] = useState<string[]>(initial?.colors || []);
  const [material, setMaterial] = useState(initial?.material || "");
  const [weight, setWeight] = useState(initial?.weight || "");
  const [quantity, setQuantity] = useState(initial?.quantity || 0);
  const [unit, setUnit] = useState(initial?.unit || "g");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [photo, setPhoto] = useState(initial?.photo || "");
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(", ") || "");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newColorHex, setNewColorHex] = useState("#d946ef");

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = new Image();
    img.onload = () => {
      const cleaned = removeBackground(img);
      setPhoto(cleaned);
      setUploading(false);
      if (!initial) analyzeImage(cleaned);
    };
    img.src = dataUrl;
  };

  const analyzeImage = (url: string) => {
    setAnalyzing(true);
    const img = new Image();
    img.onload = () => {
      const hexColors = extractDominantColors(img);
      setColors(prev => {
        const existing = new Set(prev);
        const added = hexColors.filter(c => !existing.has(c));
        return [...prev, ...added].slice(0, 8);
      });
      if (hexColors.length > 0 && !color) setColor(hexColors[0]);
      const detectedMaterial = inferMaterialFromName(name, brand);
      if (detectedMaterial && !material) setMaterial(detectedMaterial);
      setAnalyzing(false);
    };
    img.onerror = () => setAnalyzing(false);
    img.src = url;
  };

  const addColor = () => {
    setColors(prev => {
      if (prev.includes(newColorHex)) return prev;
      return [...prev, newColorHex];
    });
  };

  const removeColor = (idx: number) => {
    setColors(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name, brand, color, colors,
      material, weight,
      quantity: Number(quantity), unit,
      notes, photo,
      tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (initial) {
      await updateYarn(initial.id, data);
    } else {
      await createYarn(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-yarn rounded-[16px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[rgba(47,95,158,0.15)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#2B2B2B]">{initial ? "编辑毛线" : "添加毛线"}</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#2B2B2B] text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="名称 *" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[rgba(47,95,158,0.3)] text-[#2B2B2B]" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="品牌" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[rgba(47,95,158,0.3)] text-[#2B2B2B]" value={brand} onChange={e => setBrand(e.target.value)} />
          <div className="flex gap-3">
            <input placeholder="主颜色" className="flex-1 px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={color} onChange={e => setColor(e.target.value)} />
            <input type="color" className="w-10 h-10 rounded-[16px] border border-[rgba(47,95,158,0.2)] cursor-pointer" value={color || "#d946ef"} onChange={e => setColor(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">多种颜色（可选）</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {colors.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span className="inline-block w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: c }} />
                  <button type="button" onClick={() => removeColor(i)} className="text-[#6B6B6B] hover:text-red-600 text-xs">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="color" className="w-9 h-9 rounded-lg border border-[rgba(47,95,158,0.2)] cursor-pointer" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} />
              <button type="button" onClick={addColor} className="px-3 py-1 text-xs rounded-[18px] bg-white text-[#2B2B2B] border border-[rgba(47,95,158,0.2)] hover:shadow-lg transition">添加色块</button>
            </div>
            {analyzing && <p className="text-xs text-[#6B6B6B] mt-1">正在从图片识别颜色...</p>}
          </div>

          <input placeholder="材质（如：羊毛、棉、亚麻）" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={material} onChange={e => setMaterial(e.target.value)} />
          <div className="flex gap-3">
            <input type="number" placeholder="数量" className="flex-1 px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            <select className="px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 text-[#2B2B2B]" value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="g">克(g)</option><option value="m">米(m)</option>
              <option value="个">个</option><option value="团">团</option>
            </select>
          </div>
          <input placeholder="标签（用逗号分隔，如：粗线, 暖色, 冬季）" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={tagsStr} onChange={e => setTagsStr(e.target.value)} />
          <textarea placeholder="备注信息" rows={3} className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={notes} onChange={e => setNotes(e.target.value)} />
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">照片（上传后自动去背景、识别颜色）</label>
            <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm" />
            {uploading && <span className="text-xs text-[#6B6B6B] ml-2">处理中...</span>}
            {photo && (
              <div className="mt-2 relative inline-block">
                <img src={photo} alt="preview" className="w-28 h-28 object-contain rounded-[16px] border border-[rgba(47,95,158,0.2)]" />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="inline-block px-4 py-2 rounded-[18px] bg-white text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">
              {initial ? "保存" : "添加"}
            </button>
            <button type="button" onClick={onClose} className="inline-block px-4 py-2 rounded-[18px] bg-white text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}