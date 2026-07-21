"use client";

import { useEffect, useRef, useState } from "react";
import { useInspirationStore, useYarnStore } from "@/lib/store";
import { cleanUrl, scrapeUrl } from "@/lib/scrape";
import { useTexts } from "@/lib/language";

interface Props {
  onClose: () => void;
  initial?: {
    id: number;
    title: string;
    url: string;
    platform: string;
    image: string;
    notes: string;
    yarn_id: number | null;
    tags: string[];
    pattern: string;
  };
}

export default function InspirationForm({ onClose, initial }: Props) {
  const texts = useTexts();
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
  const abortRef = useRef<AbortController | null>(null);
  const lastScrapedRef = useRef(initial?.url || "");

  const setImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setScrapeError("");
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFromFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();
    setImageFromFile(file);
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
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setScraping(true);
    setScrapeError("");
    try {
      const data = await scrapeUrl(value, controller.signal);
      if (data.title) setTitle(data.title);
      if (data.platform) setPlatform(data.platform);
      if (data.images?.length > 0) setImage(data.images[0]);
      else setScrapeError(texts.inspFormScrapeFail);
    } catch {
      if (!controller.signal.aborted) setScrapeError(texts.inspFormScrapeError);
    } finally {
      if (!controller.signal.aborted) setScraping(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(cleanUrl(value));
  };

  const handleScrapeClick = () => {
    const cleaned = cleanUrl(url);
    if (!cleaned.startsWith("http")) return;
    setUrl(cleaned);
    lastScrapedRef.current = cleaned;
    doScrape(cleaned);
  };

  useEffect(() => {
    if (initial) return;
    const cleaned = cleanUrl(url);
    if (!cleaned.startsWith("http") || cleaned === lastScrapedRef.current) return;
    const timeout = window.setTimeout(() => {
      lastScrapedRef.current = cleaned;
      setUrl(cleaned);
      doScrape(cleaned);
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [initial, url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title,
      url,
      platform,
      notes,
      image,
      pattern,
      yarn_id: yarnId,
      tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (initial) await updateInspiration(initial.id, data);
    else await createInspiration(data);
    onClose();
  };

  return (
    <div className="modalOverlay">
      <div className="modalPanel felt-card p-4 sm:p-6 w-full max-w-lg" onPaste={handlePaste}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#2B2B2B]">
            {initial ? texts.inspFormEditTitle : texts.inspFormAddTitle}
          </h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#2B2B2B] text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder={texts.inspFormTitlePlaceholder} className="felt-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex flex-col min-[420px]:flex-row gap-2">
            <input placeholder={texts.inspFormUrlPlaceholder} className="felt-input flex-1 min-w-0" value={url} onChange={(e) => handleUrlChange(e.target.value)} />
            {url.startsWith("http") && !initial && (
              <button type="button" onClick={handleScrapeClick} disabled={scraping} className="felt-control shrink-0 disabled:opacity-50">
                {scraping ? texts.inspFormScraping : texts.inspFormFetchInfo}
              </button>
            )}
          </div>

          <div className="flex flex-col min-[420px]:flex-row gap-3">
            <select className="felt-input flex-1" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">{texts.inspFormPlatformDefault}</option>
              <option value="小红书">{texts.inspFormPlatformXiaohongshu}</option>
              <option value="Instagram">{texts.inspFormPlatformInstagram}</option>
              <option value="Ravelry">{texts.inspFormPlatformRavelry}</option>
              <option value="Pinterest">{texts.inspFormPlatformPinterest}</option>
              <option value="其他">{texts.inspFormPlatformOther}</option>
            </select>
            <select className="felt-input flex-1" value={yarnId ?? ""} onChange={(e) => setYarnId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{texts.inspFormSelectYarn}</option>
              {yarns.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>

          <input placeholder={texts.inspFormTags} className="felt-input" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
          <textarea placeholder={texts.inspFormNotes} rows={3} className="felt-input" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">
              {texts.inspFormImageLabel}
              {image && url && !initial && (
                <span className="text-xs text-green-700 ml-2">{texts.inspFormAutoScraped}</span>
              )}
            </label>
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
            {uploading && <span className="text-xs text-[#6B6B6B] ml-2">{texts.inspFormUploading}</span>}
            {scrapeError && !image && <p className="text-xs text-amber-700 mt-1">{scrapeError}</p>}
            {image && (
              <div className="mt-2 flex gap-2 items-start">
                <img
                  src={image}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    setScrapeError(texts.inspFormImageError);
                  }}
                />
                {url && (
                  <button type="button" onClick={handleScrapeClick} className="text-xs text-[#6B6B6B] hover:text-[#2B2B2B] underline">
                    {texts.inspFormRescrape}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">{texts.inspFormPatternLabel}</label>
            <div className="flex flex-col min-[420px]:flex-row gap-2 mb-2">
              <input placeholder={texts.inspFormPatternPlaceholder} className="felt-input flex-1 min-w-0 text-sm" value={pattern} onChange={(e) => setPattern(e.target.value)} />
              <label className="felt-control text-sm cursor-pointer whitespace-nowrap">
                {patternUploading ? texts.inspFormUploading : texts.inspFormUploadFile}
                <input type="file" accept="image/*,application/pdf" onChange={handlePatternUpload} className="hidden" />
              </label>
            </div>
            {pattern && (
              <div className="mt-1">
                {pattern.endsWith(".pdf") ? (
                  <a href={pattern} target="_blank" rel="noopener noreferrer" className="felt-chip text-red-700">
                    {texts.inspFormViewPdf}
                  </a>
                ) : pattern.startsWith("http") ? (
                  <a href={pattern} target="_blank" rel="noopener noreferrer" className="felt-chip text-blue-700">
                    {texts.inspFormViewPatternUrl}
                  </a>
                ) : (
                  <img src={pattern} alt="pattern" className="w-20 h-20 object-cover rounded-[14px]" />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col min-[420px]:flex-row gap-3 pt-2">
            <button type="submit" className="felt-control min-[420px]:min-w-24">{initial ? texts.inspFormSave : texts.inspFormAdd}</button>
            <button type="button" onClick={onClose} className="felt-control min-[420px]:min-w-24">{texts.inspFormCancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
