"use client";

function hexToName(hex: string): string {
  if (!hex || !hex.startsWith("#")) return hex;
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (r > 230 && g > 230 && b > 230) return "白色/white";
  if (r < 40 && g < 40 && b < 40) return "黑色/black";
  if (r > 200 && g < 80 && b < 80) return "红色/red";
  if (r > 200 && g > 100 && b < 80) return "橙色/orange";
  if (r > 200 && g > 180 && b < 80) return "黄色/yellow";
  if (r < 80 && g > 150 && b < 80) return "绿色/green";
  if (r < 80 && g < 100 && b > 180) return "蓝色/blue";
  if (r > 150 && g < 80 && b > 150) return "紫色/purple";
  if (r > 180 && g > 140 && b > 180) return "粉色/pink";
  if (r > 140 && g > 100 && b < 80) return "棕色/brown";
  if (r > 160 && g > 160 && b > 100) return "米色/beige";
  if (r < 100 && g > 100 && b > 130) return "蓝绿色/teal";
  if (r > 120 && g < 80 && b < 100) return "酒红/wine";
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
  const colorKeywords = [...colors, color].filter(Boolean).map(c => hexToName(c));
  const queryParts = Array.from(new Set([...colorKeywords, material, weight, ...tags].filter(Boolean)));
  const searchQuery = queryParts.join(" ");
  const encodedQuery = encodeURIComponent(searchQuery);

  const platforms = [
    {
      name: "小红书",
      icon: "📕",
      color: "bg-red-50 border-red-200 hover:bg-red-100",
      url: `https://www.xiaohongshu.com/search_result?keyword=${encodedQuery}&type=1`,
    },
    {
      name: "Instagram",
      icon: "📸",
      color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
      url: `https://www.instagram.com/explore/tags/${encodeURIComponent(queryParts.join(""))}/`,
    },
    {
      name: "Ravelry",
      icon: "🧶",
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      url: `https://www.ravelry.com/patterns/search#search=${encodedQuery}&view=captioned_grid&sort=best`,
    },
    {
      name: "Pinterest",
      icon: "📌",
      color: "bg-red-50 border-red-200 hover:bg-red-100",
      url: `https://www.pinterest.com/search/pins/?q=${encodedQuery}`,
    },
    {
      name: "Etsy",
      icon: "🛍️",
      color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
      url: `https://www.etsy.com/search?q=${encodedQuery}`,
    },
  ];

  return (
    <div className="card-grain rounded-[16px] p-5 border border-[rgba(47,95,158,0.15)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <h3 className="font-bold text-[#2B2B2B] mb-1">🔍 智能推荐</h3>
      <p className="text-xs text-[#6B6B6B] mb-4">根据毛线信息自动搜索：<span className="text-[#2B2B2B]">{searchQuery || "暂无关键词"}</span></p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {platforms.map(p => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`relative overflow-hidden flex items-center gap-2 px-3 py-2.5 rounded-[18px] surface-felt border border-[rgba(47,95,158,0.2)] hover:shadow-lg transition text-sm font-medium text-[#2B2B2B]`}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </a>
        ))}
      </div>
      <p className="text-xs text-[#6B6B6B] mt-3">
        点击后将在新标签页中打开搜索，可根据实际毛线特征调整关键词
      </p>
    </div>
  );
}