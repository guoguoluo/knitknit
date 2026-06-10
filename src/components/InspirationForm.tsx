"use client";
import { useState, useRef } from "react";
import { useInspirationStore, useYarnStore } from "@/lib/store";
import { cleanUrl, scrapeUrl } from "@/lib/scrape";

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
    setPatternUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setPattern(reader.result as string);
      setPatternUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const doScrape = async (value: string) => {
    setScraping(true);
    setScrapeError("");
    try {
      const data = await scrapeUrl(value);
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
    const cleaned = cleanUrl(value);
    setUrl(cleaned);
    if (!cleaned.startsWith("http")) return;
    if (initial && initial.image) return;
    if (scrapeTimer.current) clearTimeout(scrapeTimer.current);
    scrapeTimer.current = setTimeout(() => doScrape(cleaned), 800);
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
      <div className="relative overflow-hidden card-knit rounded-[16px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[rgba(47,95,158,0.15)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#2B2B2B]">{initial ? "编辑灵感" : "添加灵感"}</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#2B2B2B] text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="标题 *" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="relative">
            <input placeholder="链接 URL（粘贴后自动抓取信息）" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none pr-8 text-[#2B2B2B]" value={url} onChange={e => handleUrlChange(e.target.value)} />
            {scraping && <span className="absolute right-3 top-2.5 text-xs text-[#6B6B6B] animate-pulse">抓取中...</span>}
          </div>
          <div className="flex gap-3">
            <select className="flex-1 px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 text-[#2B2B2B]" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="">选择平台</option>
              <option value="小红书">小红书</option>
              <option value="Instagram">Instagram</option>
              <option value="Ravelry">Ravelry</option>
              <option value="Pinterest">Pinterest</option>
              <option value="其他">其他</option>
            </select>
            <select className="flex-1 px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 text-[#2B2B2B]" value={yarnId ?? ""} onChange={e => setYarnId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">关联毛线（可选）</option>
              {yarns.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <input placeholder="标签（逗号分隔，如：开衫, 麻花, 短款）" className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={tagsStr} onChange={e => setTagsStr(e.target.value)} />
          <textarea placeholder="备注" rows={3} className="w-full px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]" value={notes} onChange={e => setNotes(e.target.value)} />
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">
              参考图
              {image && url && !initial && (
                <span className="text-xs text-green-600 ml-2">✓ 已自动抓取封面</span>
              )}
            </label>
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
            {uploading && <span className="text-xs text-[#6B6B6B] ml-2">上传中...</span>}
            {scrapeError && !image && <p className="text-xs text-amber-600 mt-1">{scrapeError}</p>}
            {image && (
              <div className="mt-2 flex gap-2 items-start">
                <img src={image} alt="preview" className="w-20 h-20 object-cover rounded-[16px]"
                  onError={(e) => { e.currentTarget.style.display = "none"; setScrapeError("图片加载失败，可重新抓取或手动上传"); }} />
                {url && (
                  <button type="button" onClick={() => doScrape(url)} className="text-xs text-[#6B6B6B] hover:text-[#2B2B2B] underline">
                    重新抓取
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">图解（PDF / 图片 / 网址）</label>
            <div className="flex gap-2 mb-2">
              <input
                placeholder="或输入图解链接"
                className="flex-1 px-3 py-1.5 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 text-sm focus:outline-none text-[#2B2B2B]"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
              />
              <label className="px-3 py-1.5 text-sm rounded-[18px] surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.2)] hover:shadow-lg cursor-pointer transition whitespace-nowrap">
                {patternUploading ? "上传中..." : "上传文件"}
                <input type="file" accept="image/*,application/pdf" onChange={handlePatternUpload} className="hidden" />
              </label>
            </div>
            {pattern && (
              <div className="mt-1">
                {pattern.endsWith(".pdf") ? (
                  <a href={pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-[18px] bg-white/60 text-red-600 border border-[rgba(47,95,158,0.2)] hover:bg-white transition">
                    📄 查看PDF图解
                  </a>
                ) : pattern.startsWith("http") ? (
                  <a href={pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-[18px] bg-white/60 text-blue-600 border border-[rgba(47,95,158,0.2)] hover:bg-white transition">
                    🔗 打开图解链接
                  </a>
                ) : (
                  <img src={pattern} alt="pattern" className="w-20 h-20 object-cover rounded-[16px]" />
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="relative overflow-hidden flex-1 px-4 py-2 rounded-[18px] surface-felt-accent text-white font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-xl transition">
              {initial ? "保存" : "添加"}
            </button>
            <button type="button" onClick={onClose} className="relative overflow-hidden px-4 py-2 rounded-[18px] surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}