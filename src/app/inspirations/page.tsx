"use client";
import { useEffect, useState } from "react";
import { useInspirationStore, useYarnStore } from "@/lib/store";
import { texts } from "@/lib/texts";
import Link from "next/link";
import InspirationForm from "@/components/InspirationForm";

export default function InspirationsPage() {
  const { inspirations, loading, fetchInspirations, deleteInspiration } = useInspirationStore();
  const { yarns, fetchYarns } = useYarnStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  useEffect(() => {
    fetchInspirations();
    fetchYarns();
  }, [fetchInspirations, fetchYarns]);

  const yarnMap = new Map(yarns.map(y => [y.id, y]));

  const filtered = inspirations.filter(i => {
    const matchSearch = !filter || i.title.toLowerCase().includes(filter.toLowerCase());
    const matchPlatform = !filterPlatform || i.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const platforms = Array.from(new Set(inspirations.map(i => i.platform).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2B2B2B]">{texts.inspListHeading}</h1>
        <button onClick={() => setShowForm(true)} className="btnPatch btnPatch--coffee">
          {texts.inspListAdd}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder={texts.inspListSearch}
          className="w-full sm:flex-1 px-4 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[rgba(47,95,158,0.3)] text-[#2B2B2B]"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]">
          <option value="">{texts.inspListAllPlatforms}</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {showForm && <InspirationForm onClose={() => setShowForm(false)} />}

      {loading ? (
        <div className="text-center py-12 text-[#6B6B6B]">{texts.inspListLoading}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#6B6B6B]">{texts.inspListEmpty}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(insp => {
            const relatedYarn = insp.yarn_id ? yarnMap.get(insp.yarn_id) : null;
            const platformColors: Record<string, string> = {
              "小红书": "bg-red-100 text-red-700",
              "Instagram": "bg-pink-100 text-pink-700",
              "Ravelry": "bg-orange-100 text-orange-700",
              "Pinterest": "bg-red-100 text-red-700",
            };
            return (
              <div key={insp.id} className="bg-[#FFFAF1] rounded-[16px] border border-[rgba(47,95,158,0.15)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-xl transition group">
                <Link href={`/inspiration-detail?id=${insp.id}`} className="block p-4">
                  {insp.image ? (
                    <img src={insp.image} alt={insp.title} className="w-full h-40 object-cover rounded-[16px] mb-3" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-40 bg-[#f5efe6] rounded-[16px] mb-3 flex items-center justify-center text-4xl">💡</div>
                  )}
                  <h3 className="font-semibold text-[#2B2B2B] group-hover:text-[#2B2B2B] transition">{insp.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {insp.platform && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${platformColors[insp.platform] || "bg-white/60 text-[#6B6B6B]"}`}>
                        {insp.platform}
                      </span>
                    )}
                    {insp.pattern && <span className="text-xs text-green-600">{texts.inspListHasPattern}</span>}
                    {relatedYarn && <span className="text-xs text-[#6B6B6B]">🧶 {relatedYarn.name}</span>}
                  </div>
                  {insp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insp.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-white/60 text-[#2B2B2B] text-xs rounded-full border border-[rgba(47,95,158,0.2)]">{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
                <div className="px-4 pb-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  {insp.url && (
<a href={insp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6B6B6B] hover:text-[#2B2B2B]">
                       {texts.inspListViewOriginal}
                     </a>
                  )}
<button onClick={() => deleteInspiration(insp.id)} className="text-xs text-[#6B6B6B] hover:text-red-600 ml-auto">
                     {texts.inspListDelete}
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}