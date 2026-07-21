"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useYarnStore, useInspirationStore } from "@/lib/store";
import { useTexts } from "@/lib/language";
import YarnForm from "@/components/YarnForm";
import RecommendationPanel from "@/components/RecommendationPanel";
import Link from "next/link";

function YarnDetailContent() {
  const texts = useTexts();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const { yarns, fetchYarns, deleteYarn } = useYarnStore();
  const { inspirations, fetchInspirations } = useInspirationStore();
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetchYarns();
    fetchInspirations();
  }, [fetchYarns, fetchInspirations]);

  const yarn = yarns.find(y => y.id === Number(id));
  if (!yarn) return <div className="text-center py-12 text-gray-400">{texts.yarnNotFound}</div>;

  const relatedInspirations = inspirations.filter(i => i.yarn_id === yarn.id);
  const matchedInspirations = inspirations.filter(i => {
    if (i.yarn_id === yarn.id) return false;
    const terms = [yarn.color, yarn.material, yarn.weight, ...yarn.tags].filter(Boolean).map(s => s.toLowerCase());
    const inspText = [i.title, i.notes, i.platform, ...i.tags].filter(Boolean).map(s => s.toLowerCase());
    return inspText.some(t => terms.some(term => t.includes(term)));
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="inline-block px-3 py-1.5 rounded-[18px] bg-white text-[#2B2B2B] text-sm border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">{texts.yarnBack}</button>

        <div className="card-yarn felt-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {yarn.photo ? (
            <img src={yarn.photo} alt={yarn.name} className="w-full sm:w-40 h-40 object-cover rounded-[16px]" />
          ) : (
            <div className="w-full sm:w-40 h-40 bg-[#f5efe6] rounded-[16px] flex items-center justify-center text-5xl">🧶</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#2B2B2B]">{yarn.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {yarn.brand && <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#6B6B6B]">{yarn.brand}</span>}
              {yarn.color && <span className="inline-block w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: yarn.color }} title={yarn.color} />}
              {yarn.colors?.map(c => (
                <span key={c} className="inline-block w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: c }} title={c} />
              ))}
              {yarn.material && <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#6B6B6B]">{yarn.material}</span>}
              {yarn.weight && <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#6B6B6B]">{yarn.weight}</span>}
              {yarn.quantity > 0 && <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#6B6B6B]">{yarn.quantity}{yarn.unit}</span>}
            </div>
            {yarn.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {yarn.tags.map(t => <span key={t} className="px-2 py-0.5 bg-white/60 text-[#2B2B2B] text-xs rounded-full border border-[rgba(47,95,158,0.2)]">{t}</span>)}
              </div>
            )}
            {yarn.notes && <p className="mt-3 text-sm text-[#6B6B6B]">{yarn.notes}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setShowEdit(true)} className="inline-block px-3 py-1.5 text-sm rounded-[18px] bg-white text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">{texts.yarnEdit}</button>
              <button onClick={async () => { await deleteYarn(yarn.id); router.push("/yarns"); }} className="inline-block px-3 py-1.5 text-sm rounded-[18px] bg-white text-red-600 border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">{texts.yarnDelete}</button>
            </div>
          </div>
        </div>
      </div>

      <RecommendationPanel color={yarn.color} material={yarn.material} weight={yarn.weight} tags={yarn.tags} colors={yarn.colors} />

      {relatedInspirations.length > 0 && (
        <div className="felt-card p-5">
          <h3 className="font-bold text-[#2B2B2B] mb-3">{texts.yarnRelatedInspirations}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedInspirations.map(insp => (
              <Link href={`/inspiration-detail?id=${insp.id}`} key={insp.id} className="p-3 rounded-[16px] bg-[#FFFAF1] border border-[rgba(47,95,158,0.15)] hover:shadow-lg transition">
                <div className="font-medium text-sm text-[#2B2B2B]">{insp.title}</div>
                <div className="text-xs text-[#6B6B6B] mt-1">{insp.platform}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {matchedInspirations.length > 0 && (
        <div className="felt-card p-5">
          <h3 className="font-bold text-[#2B2B2B] mb-3">{texts.yarnRecommendedInspirations}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matchedInspirations.map(insp => (
              <Link href={`/inspiration-detail?id=${insp.id}`} key={insp.id} className="p-3 rounded-[16px] bg-[#FFFAF1] border border-[rgba(47,95,158,0.15)] hover:shadow-lg transition">
                <div className="font-medium text-sm text-[#2B2B2B]">{insp.title}</div>
                <div className="flex gap-1 mt-1">
                  {insp.tags.slice(0, 3).map(t => <span key={t} className="px-1.5 py-0.5 bg-white/60 text-[#2B2B2B] text-xs rounded-full border border-[rgba(47,95,158,0.2)]">{t}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showEdit && <YarnForm initial={yarn} onClose={() => { setShowEdit(false); fetchYarns(); }} />}
    </div>
    </div>
  );
}

export default function YarnDetail() {
  return (<Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}><YarnDetailContent /></Suspense>);
}
