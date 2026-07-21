"use client";

import { useLanguage, useTexts } from "@/lib/language";

function hexToName(hex: string, language: "zh" | "en"): string {
  if (!hex || !hex.startsWith("#")) return hex;
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const pair = (zh: string, en: string) => language === "zh" ? `${zh}/${en}` : en;
  if (r > 230 && g > 230 && b > 230) return pair("白色", "white");
  if (r < 40 && g < 40 && b < 40) return pair("黑色", "black");
  if (r > 200 && g < 80 && b < 80) return pair("红色", "red");
  if (r > 200 && g > 100 && b < 80) return pair("橙色", "orange");
  if (r > 200 && g > 180 && b < 80) return pair("黄色", "yellow");
  if (r < 80 && g > 150 && b < 80) return pair("绿色", "green");
  if (r < 80 && g < 100 && b > 180) return pair("蓝色", "blue");
  if (r > 150 && g < 80 && b > 150) return pair("紫色", "purple");
  if (r > 180 && g > 140 && b > 180) return pair("粉色", "pink");
  if (r > 140 && g > 100 && b < 80) return pair("棕色", "brown");
  if (r > 160 && g > 160 && b > 100) return pair("米色", "beige");
  if (r < 100 && g > 100 && b > 130) return pair("蓝绿色", "teal");
  if (r > 120 && g < 80 && b < 100) return pair("酒红", "wine");
  return hex;
}

interface Props {
  color: string;
  material: string;
  weight: string;
  tags: string[];
  colors?: string[];
}

export default function RecommendationPanel({ color, material, weight, tags, colors = [] }: Props) {
  const texts = useTexts();
  const { language } = useLanguage();
  const colorKeywords = [...colors, color].filter(Boolean).map((c) => hexToName(c, language));
  const queryParts = Array.from(new Set([...colorKeywords, material, weight, ...tags].filter(Boolean)));
  const searchQuery = queryParts.join(" ");
  const encodedQuery = encodeURIComponent(searchQuery);

  const platforms = [
    { name: "Xiaohongshu", icon: "📕", url: `https://www.xiaohongshu.com/search_result?keyword=${encodedQuery}&type=1` },
    { name: "Instagram", icon: "📸", url: `https://www.instagram.com/explore/tags/${encodeURIComponent(queryParts.join(""))}/` },
    { name: "Ravelry", icon: "🧶", url: `https://www.ravelry.com/patterns/search#search=${encodedQuery}&view=captioned_grid&sort=best` },
    { name: "Pinterest", icon: "📌", url: `https://www.pinterest.com/search/pins/?q=${encodedQuery}` },
    { name: "Etsy", icon: "🛍️", url: `https://www.etsy.com/search?q=${encodedQuery}` },
  ];

  return (
    <div className="felt-card p-5">
      <h3 className="font-bold text-[#2B2B2B] mb-1">{texts.recHeading}</h3>
      <p className="text-xs text-[#6B6B6B] mb-4">
        {texts.recDescription} <span className="text-[#2B2B2B]">{searchQuery || texts.recNoKeywords}</span>
      </p>
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[18px] bg-white border border-[rgba(47,95,158,0.2)] hover:shadow-lg transition text-sm font-medium text-[#2B2B2B] min-w-0"
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </a>
        ))}
      </div>
      <p className="text-xs text-[#6B6B6B] mt-3">{texts.recFootnote}</p>
    </div>
  );
}
