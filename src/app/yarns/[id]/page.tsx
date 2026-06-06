"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useYarnStore, useInspirationStore } from "@/lib/store";
import { texts } from "@/lib/texts";
import YarnForm from "@/components/YarnForm";
import RecommendationPanel from "@/components/RecommendationPanel";
import Link from "next/link";

export default function YarnDetail() {
  const { id } = useParams<{ id: string }>();
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
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="text-sm text-purple-600 hover:text-purple-800">&larr; {texts.yarnBack}</button>

      <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {yarn.photo ? (
            <img src={yarn.photo} alt={yarn.name} className="w-full sm:w-40 h-40 object-cover rounded-2xl" />
          ) : (
            <div className="w-full sm:w-40 h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-5xl">🧶</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{yarn.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {yarn.brand && <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">{yarn.brand}</span>}
              {yarn.color && <span className="inline-block w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: yarn.color }} title={yarn.color} />}
              {yarn.colors?.map(c => (
                <span key={c} className="inline-block w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: c }} title={c} />
              ))}
              {yarn.material && <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">{yarn.material}</span>}
              {yarn.weight && <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">{yarn.weight}</span>}
              {yarn.quantity > 0 && <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">{yarn.quantity}{yarn.unit}</span>}
            </div>
            {yarn.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {yarn.tags.map(t => <span key={t} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{t}</span>)}
              </div>
            )}
            {yarn.notes && <p className="mt-3 text-sm text-gray-500">{yarn.notes}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition">{texts.yarnEdit}</button>
              <button onClick={async () => { await deleteYarn(yarn.id); router.push("/yarns"); }} className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">{texts.yarnDelete}</button>
            </div>
          </div>
        </div>
      </div>

      <RecommendationPanel color={yarn.color} material={yarn.material} weight={yarn.weight} tags={yarn.tags} colors={yarn.colors} />

      {relatedInspirations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">{texts.yarnRelatedInspirations}</h3>
          <div className="grid grid-cols-2 gap-3">
            {relatedInspirations.map(insp => (
              <Link href={`/inspirations/${insp.id}`} key={insp.id} className="p-3 rounded-xl border border-purple-100 hover:bg-purple-50 transition">
                <div className="font-medium text-sm text-gray-800">{insp.title}</div>
                <div className="text-xs text-gray-400 mt-1">{insp.platform}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {matchedInspirations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">{texts.yarnRecommendedInspirations}</h3>
          <div className="grid grid-cols-2 gap-3">
            {matchedInspirations.map(insp => (
              <Link href={`/inspirations/${insp.id}`} key={insp.id} className="p-3 rounded-xl border border-purple-100 hover:bg-purple-50 transition">
                <div className="font-medium text-sm text-gray-800">{insp.title}</div>
                <div className="flex gap-1 mt-1">
                  {insp.tags.slice(0, 3).map(t => <span key={t} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">{t}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showEdit && <YarnForm initial={yarn} onClose={() => { setShowEdit(false); fetchYarns(); }} />}
    </div>
    </main>
  );
}