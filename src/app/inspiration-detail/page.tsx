"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInspirationStore, useYarnStore } from "@/lib/store";
import { texts } from "@/lib/texts";
import InspirationForm from "@/components/InspirationForm";
import Link from "next/link";

function InspirationDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const { inspirations, fetchInspirations, deleteInspiration } = useInspirationStore();
  const { yarns, fetchYarns } = useYarnStore();
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetchInspirations();
    fetchYarns();
  }, [fetchInspirations, fetchYarns]);

  const insp = inspirations.find(i => i.id === Number(id));
  if (!insp) return <div className="text-center py-12 text-gray-400">{texts.inspNotFound}</div>;

  const relatedYarn = insp.yarn_id ? yarns.find(y => y.id === insp.yarn_id) : null;

  const handleDelete = async () => {
    await deleteInspiration(insp.id);
    router.push("/inspirations");
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="text-sm text-purple-600 hover:text-purple-800">{texts.inspBack}</button>

      <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {insp.image ? (
            <img src={insp.image} alt={insp.title} className="w-full sm:w-40 h-40 object-cover rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full sm:w-40 h-40 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-5xl">💡</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{insp.title}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {insp.platform && (
                <span className="px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700">{insp.platform}</span>
              )}
              {relatedYarn && (
                <Link href={`/yarn-detail?id=${relatedYarn.id}`} className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 transition">
                  🧶 {relatedYarn.name}
                </Link>
              )}
            </div>
            {insp.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {insp.tags.map(t => <span key={t} className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full">{t}</span>)}
              </div>
            )}
            {insp.notes && <p className="mt-3 text-sm text-gray-500">{insp.notes}</p>}
            {insp.pattern && (
              <div className="mt-3">
                <span className="text-xs text-gray-400 font-medium">{texts.inspPatternLabel}</span>
                {insp.pattern.endsWith(".pdf") ? (
                  <a href={insp.pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
                    {texts.inspPdfPattern}
                  </a>
                ) : insp.pattern.startsWith("http") ? (
                  <a href={insp.pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition">
                    {texts.inspUrlPattern}
                  </a>
                ) : (
                  <a href={insp.pattern} target="_blank" rel="noopener noreferrer">
                    <img src={insp.pattern} alt="pattern" className="mt-1 w-32 rounded-xl border border-purple-100" />
                  </a>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {insp.url && (
                <a href={insp.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition">
                  {texts.inspViewOriginal}
                </a>
              )}
              <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 text-sm rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition">编辑</button>
              <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3">🔄 相关灵感和推荐搜索</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(insp.title)}&type=1`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            📕 小红书搜同款
          </a>
          <a
            href={`https://www.ravelry.com/patterns/search#search=${encodeURIComponent(insp.title)}&view=captioned_grid&sort=best`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 transition"
          >
            🧶 Ravelry搜同款
          </a>
          <a
            href={`https://www.instagram.com/explore/tags/${encodeURIComponent(insp.title.replace(/\s+/g, ""))}/`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 transition"
          >
            📸 Instagram搜同款
          </a>
        </div>
      </div>

      {relatedYarn && (
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">🧶 关联的毛线</h3>
          <div className="flex items-center gap-4">
            {relatedYarn.photo && <img src={relatedYarn.photo} alt={relatedYarn.name} className="w-16 h-16 object-cover rounded-xl" />}
            <div>
              <Link href={`/yarn-detail?id=${relatedYarn.id}`} className="font-semibold text-gray-800 hover:text-purple-600 transition">{relatedYarn.name}</Link>
              <div className="flex flex-wrap gap-1 mt-1">
                {relatedYarn.material && <span className="text-xs text-gray-500">{relatedYarn.material}</span>}
                {relatedYarn.color && <span className="text-xs text-gray-500">· {relatedYarn.color}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && <InspirationForm initial={insp} onClose={() => { setShowEdit(false); fetchInspirations(); }} />}
    </div>
    </div>
  );
}

export default function InspirationDetail() {
  return (<Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}><InspirationDetailContent /></Suspense>);
}
