"use client";
import { useState, useRef } from "react";
import { useInspirationStore, useYarnStore } from "@/lib/store";

interface Props {
  onClose: () => void;
  initial?: { id: number; title: string; url: string; platform: string; image: string; notes: string; yarn_id: number | null; tags: string[]; pattern: string };
}

export default function InspirationForm({ onClose, initial }: Props) {
  const { createInspiration, updateInspiration } = useInspirationStore();
  const { yarns } = useYarnStore();
  const [title, setTitle] = useState(initial?.title || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [platform, setPlatform] = useState(initial?.platform || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [image, setImage] = useState(initial?.image || "");
  const [pattern, setPattern] = useState(initial?.pattern || "");
  const [yarnId, setYarnId] = useState<number | null>(initial?.yarn_id ?? null);
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(", ") || "");
  const [uploading, setUploading] = useState(false);
  const [patternUploading, setPatternUploading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const scrapeTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePatternUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setPatternUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      setPattern(data.url);
      setPatternUploading(false);
    } else {
      setPatternUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setPattern(reader.result as string);
        setPatternUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const doScrape = async (value: string) => {
    setScraping(true);
    setScrapeError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
        cache: "no-cache",
      });
      if (!res.ok) throw new Error("scrape failed");
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.platform) setPlatform(data.platform);
      if (data.images?.length > 0) setImage(data.images[0]);
      else setScrapeError("未能自动抓取到封面图片，可手动上传");
    } catch {
      setScrapeError("抓取失败，可手动填写");
    }
    setScraping(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (!value.startsWith("http")) return;
    if (initial && initial.image) return;
    if (scrapeTimer.current) clearTimeout(scrapeTimer.current);
    scrapeTimer.current = setTimeout(() => doScrape(value), 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title, url, platform, notes, image, pattern,
      yarn_id: yarnId,
      tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (initial) {
      await updateInspiration(initial.id, data);
    } else {
      await createInspiration(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">{initial ? "编辑灵感" : "添加灵感"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="标题 *" className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="relative">
            <input placeholder="链接 URL（粘贴后自动抓取信息）" className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none pr-8" value={url} onChange={e => handleUrlChange(e.target.value)} />
            {scraping && <span className="absolute right-3 top-2.5 text-xs text-purple-500 animate-pulse">抓取中...</span>}
          </div>
          <div className="flex gap-3">
            <select className="flex-1 px-3 py-2 rounded-xl border border-purple-200" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="">选择平台</option>
              <option value="小红书">小红书</option>
              <option value="Instagram">Instagram</option>
              <option value="Ravelry">Ravelry</option>
              <option value="Pinterest">Pinterest</option>
              <option value="其他">其他</option>
            </select>
            <select className="flex-1 px-3 py-2 rounded-xl border border-purple-200" value={yarnId ?? ""} onChange={e => setYarnId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">关联毛线（可选）</option>
              {yarns.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <input placeholder="标签（逗号分隔，如：开衫, 麻花, 短款）" className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none" value={tagsStr} onChange={e => setTagsStr(e.target.value)} />
          <textarea placeholder="备注" rows={3} className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none" value={notes} onChange={e => setNotes(e.target.value)} />
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              参考图
              {image && url && !initial && (
                <span className="text-xs text-green-500 ml-2">✓ 已自动抓取封面</span>
              )}
            </label>
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
            {uploading && <span className="text-xs text-purple-500 ml-2">上传中...</span>}
            {scrapeError && !image && <p className="text-xs text-amber-500 mt-1">{scrapeError}</p>}
            {image && (
              <div className="mt-2 flex gap-2 items-start">
                <img src={image} alt="preview" className="w-20 h-20 object-cover rounded-xl"
                  onError={(e) => { e.currentTarget.style.display = "none"; setScrapeError("图片加载失败，可重新抓取或手动上传"); }} />
                {url && (
                  <button type="button" onClick={() => doScrape(url)} className="text-xs text-purple-500 hover:underline">
                    重新抓取
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">图解（PDF / 图片 / 网址）</label>
            <div className="flex gap-2 mb-2">
              <input
                placeholder="或输入图解链接"
                className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 text-sm focus:outline-none"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
              />
              <label className="px-3 py-1.5 text-sm rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 cursor-pointer transition whitespace-nowrap">
                {patternUploading ? "上传中..." : "上传文件"}
                <input type="file" accept="image/*,application/pdf" onChange={handlePatternUpload} className="hidden" />
              </label>
            </div>
            {pattern && (
              <div className="mt-1">
                {pattern.endsWith(".pdf") ? (
                  <a href={pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
                    📄 查看PDF图解
                  </a>
                ) : pattern.startsWith("http") ? (
                  <a href={pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition">
                    🔗 打开图解链接
                  </a>
                ) : (
                  <img src={pattern} alt="pattern" className="w-20 h-20 object-cover rounded-xl" />
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-lg transition">
              {initial ? "保存" : "添加"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}