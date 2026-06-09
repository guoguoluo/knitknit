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
        <h1 className="text-2xl font-bold text-gray-800">{texts.inspListHeading}</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-lg transition">
          {texts.inspListAdd}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder={texts.inspListSearch}
          className="w-full sm:flex-1 px-4 py-2 rounded-xl border border-purple-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-xl border border-purple-200 bg-white/70 focus:outline-none">
          <option value="">{texts.inspListAllPlatforms}</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {showForm && <InspirationForm onClose={() => setShowForm(false)} />}

      {loading ? (
        <div className="text-center py-12 text-gray-400">{texts.inspListLoading}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{texts.inspListEmpty}</div>
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
              <div key={insp.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition group">
                <Link href={`/inspiration-detail?id=${insp.id}`} className="block p-4">
                  {insp.image ? (
                    <img src={insp.image} alt={insp.title} className="w-full h-40 object-cover rounded-xl mb-3" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl mb-3 flex items-center justify-center text-4xl">💡</div>
                  )}
                  <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition">{insp.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {insp.platform && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${platformColors[insp.platform] || "bg-gray-100 text-gray-600"}`}>
                        {insp.platform}
                      </span>
                    )}
                    {insp.pattern && <span className="text-xs text-green-500">{texts.inspListHasPattern}</span>}
                    {relatedYarn && <span className="text-xs text-purple-500">🧶 {relatedYarn.name}</span>}
                  </div>
                  {insp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insp.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
                <div className="px-4 pb-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  {insp.url && (
<a href={insp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700">
                       {texts.inspListViewOriginal}
                     </a>
                  )}
<button onClick={() => deleteInspiration(insp.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto">
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