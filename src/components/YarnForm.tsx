"use client";

import { useCallback, useRef, useState } from "react";
import { useYarnStore } from "@/lib/store";
import { texts as baseTexts } from "@/lib/texts";
import { useTexts } from "@/lib/language";

interface Props {
  onClose: () => void;
  initial?: {
    id: number;
    name: string;
    brand: string;
    color: string;
    material: string;
    weight: string;
    quantity: number;
    unit: string;
    notes: string;
    photo: string;
    tags: string[];
    colors: string[];
  };
}

type Rgb = [number, number, number];

function rgbDistance(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr * 0.9 + dg * dg * 1.2 + db * db * 0.9);
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}

function getImageData(img: HTMLImageElement, maxW = 720): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; imageData: ImageData } {
  const scale = Math.min(1, maxW / img.naturalWidth);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, ctx, imageData: ctx.getImageData(0, 0, width, height) };
}

function estimateBackground(data: Uint8ClampedArray, width: number, height: number): Rgb {
  const buckets = new Map<string, { rgb: Rgb; count: number }>();
  const add = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    const item = buckets.get(key) || { rgb: [0, 0, 0], count: 0 };
    item.rgb[0] += data[i];
    item.rgb[1] += data[i + 1];
    item.rgb[2] += data[i + 2];
    item.count += 1;
    buckets.set(key, item);
  };

  const step = Math.max(1, Math.floor(Math.min(width, height) / 90));
  for (let x = 0; x < width; x += step) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    add(0, y);
    add(width - 1, y);
  }

  const winner = Array.from(buckets.values()).sort((a, b) => b.count - a.count)[0];
  if (!winner) return [255, 255, 255];
  return winner.rgb.map((v) => v / winner.count) as Rgb;
}

function removeBackground(img: HTMLImageElement): string {
  const { canvas, ctx, imageData } = getImageData(img);
  const { data, width, height } = imageData;
  const bg = estimateBackground(data, width, height);
  const bgMask = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  const threshold = 48;
  const softThreshold = 72;

  const push = (x: number, y: number) => {
    const idx = y * width + x;
    if (!visited[idx]) {
      visited[idx] = 1;
      stack.push(idx);
    }
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop()!;
    const i = idx * 4;
    const current: Rgb = [data[i], data[i + 1], data[i + 2]];
    if (rgbDistance(current, bg) > threshold) continue;
    bgMask[idx] = 1;
    const x = idx % width;
    const y = Math.floor(idx / width);
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  for (let idx = 0; idx < width * height; idx++) {
    const i = idx * 4;
    const current: Rgb = [data[i], data[i + 1], data[i + 2]];
    const dist = rgbDistance(current, bg);
    if (bgMask[idx]) {
      data[i + 3] = 0;
    } else if (dist < softThreshold) {
      data[i + 3] = Math.min(data[i + 3], Math.round(((dist - threshold) / (softThreshold - threshold)) * 255));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function extractDominantColors(img: HTMLImageElement): string[] {
  const { imageData } = getImageData(img, 240);
  const { data } = imageData;
  const samples: Rgb[] = [];

  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3];
    if (alpha < 96) continue;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }

  if (samples.length === 0) return [];

  const buckets = new Map<string, { rgb: Rgb; count: number }>();
  for (const sample of samples) {
    const key = sample.map((value) => Math.round(value / 24) * 24).join(",");
    const bucket = buckets.get(key) || { rgb: [0, 0, 0], count: 0 };
    bucket.rgb[0] += sample[0];
    bucket.rgb[1] += sample[1];
    bucket.rgb[2] += sample[2];
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const allCandidates = Array.from(buckets.values())
    .map((bucket) => ({
      rgb: bucket.rgb.map((value) => value / bucket.count) as Rgb,
      count: bucket.count,
    }))
    .sort((a, b) => b.count - a.count);

  const candidates = allCandidates
    .filter((bucket) => bucket.count >= Math.max(4, samples.length * 0.003))
    .sort((a, b) => b.count - a.count)
    .slice(0, 28);

  if (candidates.length === 0) candidates.push(...allCandidates.slice(0, 12));

  const centers: Rgb[] = [];
  for (const candidate of candidates) {
    const nearest = centers.length === 0
      ? Infinity
      : Math.min(...centers.map((center) => rgbDistance(center, candidate.rgb)));
    if (nearest > 26 || centers.length < Math.min(3, candidates.length)) {
      centers.push([...candidate.rgb] as Rgb);
    }
    if (centers.length >= 6) break;
  }

  while (centers.length < Math.min(4, candidates.length)) {
    const next = candidates
      .filter((candidate) => centers.every((center) => rgbDistance(center, candidate.rgb) > 14))
      .sort((a, b) => {
        const aDist = Math.min(...centers.map((center) => rgbDistance(center, a.rgb)));
        const bDist = Math.min(...centers.map((center) => rgbDistance(center, b.rgb)));
        return bDist * Math.log(b.count + 1) - aDist * Math.log(a.count + 1);
      })[0];
    if (!next) break;
    centers.push([...next.rgb] as Rgb);
  }

  for (let iter = 0; iter < 8; iter++) {
    const sums = centers.map(() => ({ rgb: [0, 0, 0] as Rgb, count: 0 }));
    for (const sample of samples) {
      let best = 0;
      let bestDist = Infinity;
      centers.forEach((center, idx) => {
        const dist = rgbDistance(center, sample);
        if (dist < bestDist) {
          best = idx;
          bestDist = dist;
        }
      });
      sums[best].rgb[0] += sample[0];
      sums[best].rgb[1] += sample[1];
      sums[best].rgb[2] += sample[2];
      sums[best].count += 1;
    }
    sums.forEach((sum, idx) => {
      if (sum.count > 0) centers[idx] = sum.rgb.map((v) => v / sum.count) as Rgb;
    });
  }

  const scored = centers.map((center) => {
    const count = samples.filter((sample) => rgbDistance(sample, center) < 54).length;
    return { color: rgbToHex(center), count };
  });

  return scored
    .sort((a, b) => b.count - a.count)
    .map((item) => item.color)
    .filter((color, idx, arr) => arr.findIndex((other) => rgbDistance(hexToRgb(other), hexToRgb(color)) < 18) === idx)
    .slice(0, 1);
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function inferMaterialFromName(name: string, brand: string): string {
  const source = `${name} ${brand}`.toLowerCase();
  for (const material of baseTexts.knownMaterials) {
    if (source.includes(material.toLowerCase())) return material;
  }
  for (const [needle, material] of Object.entries(baseTexts.materialMap)) {
    if (source.includes(needle)) return material;
  }
  return "";
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default function YarnForm({ onClose, initial }: Props) {
  const texts = useTexts();
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
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [processedPhoto, setProcessedPhoto] = useState(initial?.photo || "");
  const [usingOriginalPhoto, setUsingOriginalPhoto] = useState(false);
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(", ") || "");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newColorHex, setNewColorHex] = useState("#d946ef");
  const fileRef = useRef<HTMLInputElement>(null);

  const processImageDataUrl = useCallback(async (dataUrl: string) => {
    setUploading(true);
    setAnalyzing(true);
    setOriginalPhoto(dataUrl);
    setUsingOriginalPhoto(false);
    try {
      const sourceImg = await loadImage(dataUrl);
      const cleaned = removeBackground(sourceImg);
      setProcessedPhoto(cleaned);
      setPhoto(cleaned);
      const cleanedImg = await loadImage(cleaned);
      const [dominantColor] = extractDominantColors(cleanedImg);
      if (dominantColor) {
        setColor(dominantColor);
        setNewColorHex(dominantColor);
      }

      const detectedMaterial = inferMaterialFromName(name, brand);
      if (detectedMaterial && !material) setMaterial(detectedMaterial);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }, [brand, material, name]);

  const useOriginalPhoto = () => {
    if (!originalPhoto) return;
    setUsingOriginalPhoto(true);
    setPhoto(originalPhoto);
  };

  const useProcessedPhoto = () => {
    if (!processedPhoto) return;
    setUsingOriginalPhoto(false);
    setPhoto(processedPhoto);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageDataUrl(await readFileAsDataUrl(file));
    e.target.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const imageFile = Array.from(e.clipboardData.files).find((file) => file.type.startsWith("image/"))
      || Array.from(e.clipboardData.items)
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
    if (!imageFile) return;
    e.preventDefault();
    await processImageDataUrl(await readFileAsDataUrl(imageFile));
  };

  const setMainColor = (hex: string) => {
    setColor(hex);
    setNewColorHex(hex);
  };

  const addColor = (hex: string) => {
    setNewColorHex(hex);
    setColors((prev) => prev.some((existing) => rgbDistance(hexToRgb(existing), hexToRgb(hex)) < 12) ? prev : [...prev, hex]);
    if (!color) setColor(hex);
  };

  const removeColor = (idx: number) => {
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      brand,
      color,
      colors,
      material,
      weight,
      quantity: Number(quantity),
      unit,
      notes,
      photo,
      tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (initial) await updateYarn(initial.id, data);
    else await createYarn(data);
    onClose();
  };

  return (
    <div className="modalOverlay" onPaste={handlePaste}>
      <div className="modalPanel card-yarn felt-card p-4 sm:p-6 w-full max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2B2B2B]">{initial ? texts.yarnFormEditTitle : texts.yarnFormAddTitle}</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#2B2B2B] text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder={texts.yarnFormName} className="felt-input" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder={texts.yarnFormBrand} className="felt-input" value={brand} onChange={(e) => setBrand(e.target.value)} />

          <div className="flex gap-3 items-stretch">
            <input placeholder={texts.yarnFormMainColor} className="felt-input flex-1 min-w-0" value={color} onChange={(e) => setColor(e.target.value)} />
            <label
              className={`colorAddControl colorAddControl--main${color ? "" : " colorAddControl--empty"}`}
              style={color ? { backgroundColor: color } : undefined}
              title={texts.yarnFormMainColor}
            >
              <input
                type="color"
                value={color && /^#[0-9a-f]{6}$/i.test(color) ? color : newColorHex}
                onChange={(e) => setMainColor(e.target.value)}
                aria-label={texts.yarnFormMainColor}
              />
              {!color && <span aria-hidden="true">+</span>}
            </label>
          </div>

          {colors.length > 0 && (
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-1">{texts.yarnFormMultiColor}</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, i) => (
                    <button
                      key={`${c}-${i}`}
                      type="button"
                      onClick={() => removeColor(i)}
                      className="colorChip"
                      style={{ backgroundColor: c }}
                      title={texts.yarnFormRemoveColorTitle(c)}
                    />
                  ))}
                  <label
                    className="colorAddControl"
                    style={{ backgroundColor: newColorHex }}
                    title={texts.yarnFormAddColor}
                  >
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => addColor(e.target.value)}
                      aria-label={texts.yarnFormAddColor}
                    />
                    <span aria-hidden="true">+</span>
                  </label>
                </div>
              </div>
              {analyzing && <p className="text-xs text-[#6B6B6B] mt-1">{texts.yarnFormAnalyzing}</p>}
            </div>
          )}
          {colors.length === 0 && analyzing && <p className="text-xs text-[#6B6B6B] mt-1">{texts.yarnFormAnalyzing}</p>}

          <input placeholder={texts.yarnFormMaterial} className="felt-input" value={material} onChange={(e) => setMaterial(e.target.value)} />
          <div className="flex flex-col min-[420px]:flex-row gap-3">
            <input type="number" placeholder={texts.yarnFormQty} className="felt-input flex-1 min-w-0" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            <select className="felt-input min-[420px]:w-32" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="g">{texts.yarnFormUnitG}</option>
              <option value="m">{texts.yarnFormUnitM}</option>
              <option value="个">{texts.yarnFormUnitPiece}</option>
              <option value="团">{texts.yarnFormUnitBall}</option>
            </select>
          </div>
          <input placeholder={texts.yarnFormTags} className="felt-input" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
          <textarea placeholder={texts.yarnFormNotes} rows={3} className="felt-input" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">{texts.yarnFormPhoto}</label>
            <div
              className="felt-upload"
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
            >
              {photo ? (
                <img src={photo} alt="preview" className="max-h-44 w-full object-contain" />
              ) : (
                <span>{texts.yarnFormPasteHint}</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" style={{ display: "none" }} />
            {uploading && <span className="text-xs text-[#6B6B6B] mt-1 inline-block">{texts.yarnFormProcessing}</span>}
            {originalPhoto && processedPhoto && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={useOriginalPhoto} className={`felt-chip text-xs ${usingOriginalPhoto ? "ring-2 ring-[rgba(80,62,76,0.22)]" : ""}`}>
                  {texts.yarnFormUseOriginalPhoto}
                </button>
                <button type="button" onClick={useProcessedPhoto} className={`felt-chip text-xs ${!usingOriginalPhoto ? "ring-2 ring-[rgba(80,62,76,0.22)]" : ""}`}>
                  {texts.yarnFormUseProcessedPhoto}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col min-[420px]:flex-row gap-3 pt-2">
            <button type="submit" className="felt-control min-[420px]:min-w-24">{initial ? texts.yarnFormSave : texts.yarnFormAdd}</button>
            <button type="button" onClick={onClose} className="felt-control min-[420px]:min-w-24">{texts.yarnFormCancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
