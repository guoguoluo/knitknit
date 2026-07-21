"use client";
import { useEffect, useState } from "react";
import { useYarnStore } from "@/lib/store";
import { useTexts } from "@/lib/language";
import Link from "next/link";
import YarnForm from "@/components/YarnForm";

export default function YarnsPage() {
  const texts = useTexts();
  const { yarns, loading, fetchYarns, deleteYarn } = useYarnStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterTag, setFilterTag] = useState("");

  useEffect(() => { fetchYarns(); }, [fetchYarns]);

  const allTags = Array.from(new Set(yarns.flatMap(y => y.tags))).sort();
  const filtered = yarns.filter(y => {
    const matchSearch = !filter || y.name.toLowerCase().includes(filter.toLowerCase()) || y.brand.toLowerCase().includes(filter.toLowerCase());
    const matchTag = !filterTag || y.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
    <div>
      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2B2B2B]">{texts.yarnListHeading}</h1>
        <button onClick={() => setShowForm(true)} className="btnPatch btnPatch--white">
          {texts.yarnListAdd}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder={texts.yarnListSearch}
          className="w-full sm:flex-1 px-4 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[rgba(47,95,158,0.3)] text-[#2B2B2B]"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-[16px] border border-[rgba(47,95,158,0.2)] bg-white/80 focus:outline-none text-[#2B2B2B]"
        >
          <option value="">{texts.yarnListAllTags}</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {showForm && <YarnForm onClose={() => setShowForm(false)} />}

      {loading ? (
        <div className="text-center py-12 text-[#6B6B6B]">{texts.yarnListLoading}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#6B6B6B]">{texts.yarnListEmpty}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(yarn => (
            <Link href={`/yarn-detail?id=${yarn.id}`} key={yarn.id}>
              <div className="card-yarn felt-card p-4 hover:shadow-xl transition cursor-pointer group">
                {yarn.photo ? (
                  <img src={yarn.photo} alt={yarn.name} className="w-full h-40 object-cover rounded-[16px] mb-3" />
                ) : (
                  <div className="w-full h-40 bg-[#f5efe6] rounded-[16px] mb-3 flex items-center justify-center text-4xl">
                    🧶
                  </div>
                )}
                <h3 className="font-semibold text-[#2B2B2B] group-hover:text-[#2B2B2B] transition">{yarn.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2 text-xs text-[#6B6B6B]">
                  {yarn.brand && <span className="px-2 py-0.5 bg-white/60 rounded-full">{yarn.brand}</span>}
                  {yarn.color && <span className="inline-block w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: yarn.color }} title={yarn.color} />}
                  {yarn.colors?.map(c => (
                    <span key={c} className="inline-block w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: c }} title={c} />
                  ))}
                  {yarn.material && <span className="px-2 py-0.5 bg-white/60 rounded-full">{yarn.material}</span>}
                  {yarn.weight && <span className="px-2 py-0.5 bg-white/60 rounded-full">{yarn.weight}</span>}
                  {yarn.quantity > 0 && <span className="px-2 py-0.5 bg-white/60 rounded-full">{yarn.quantity}{yarn.unit}</span>}
                </div>
                {yarn.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {yarn.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-white/60 text-[#2B2B2B] text-xs rounded-full border border-[rgba(47,95,158,0.2)]">{t}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={e => { e.preventDefault(); deleteYarn(yarn.id); }}
                  className="mt-3 text-xs text-[#6B6B6B] hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                >
                  {texts.yarnListDelete}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
