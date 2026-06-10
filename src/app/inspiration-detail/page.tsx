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
      <button onClick={() => router.back()} className="relative overflow-hidden px-3 py-1.5 rounded-[18px] surface-felt text-[#2B2B2B] text-sm border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">{texts.inspBack}</button>

      <div className="card-grain rounded-[16px] p-6 border border-[rgba(47,95,158,0.15)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {insp.image ? (
            <img src={insp.image} alt={insp.title} className="w-full sm:w-40 h-40 object-cover rounded-[16px]" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full sm:w-40 h-40 bg-[#f5efe6] rounded-[16px] flex items-center justify-center text-5xl">💡</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#2B2B2B]">{insp.title}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {insp.platform && (
                <span className="px-3 py-1 rounded-full text-sm bg-white/60 text-[#6B6B6B]">{insp.platform}</span>
              )}
              {relatedYarn && (
                <Link href={`/yarn-detail?id=${relatedYarn.id}`} className="px-3 py-1 rounded-full text-sm surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">
                  🧶 {relatedYarn.name}
                </Link>
              )}
            </div>
            {insp.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {insp.tags.map(t => <span key={t} className="px-2 py-0.5 surface-felt text-[#2B2B2B] text-xs rounded-full border border-[rgba(47,95,158,0.2)]">{t}</span>)}
              </div>
            )}
            {insp.notes && <p className="mt-3 text-sm text-[#6B6B6B]">{insp.notes}</p>}
            {insp.pattern && (
              <div className="mt-3">
                <span className="text-xs text-[#6B6B6B] font-medium">{texts.inspPatternLabel}</span>
                {insp.pattern.endsWith(".pdf") ? (
                  <a href={insp.pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/60 text-red-600 border border-[rgba(47,95,158,0.2)] hover:bg-white transition">
                    {texts.inspPdfPattern}
                  </a>
                ) : insp.pattern.startsWith("http") ? (
                  <a href={insp.pattern} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/60 text-blue-600 border border-[rgba(47,95,158,0.2)] hover:bg-white transition">
                    {texts.inspUrlPattern}
                  </a>
                ) : (
                  <a href={insp.pattern} target="_blank" rel="noopener noreferrer">
                    <img src={insp.pattern} alt="pattern" className="mt-1 w-32 rounded-[16px] border border-[rgba(47,95,158,0.15)]" />
                  </a>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {insp.url && (
                <a href={insp.url} target="_blank" rel="noopener noreferrer" className="relative overflow-hidden px-3 py-1.5 text-sm rounded-[18px] surface-felt-accent text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-xl transition">
                  {texts.inspViewOriginal}
                </a>
              )}
              <button onClick={() => setShowEdit(true)} className="relative overflow-hidden px-3 py-1.5 text-sm rounded-[18px] surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">编辑</button>
              <button onClick={handleDelete} className="relative overflow-hidden px-3 py-1.5 text-sm rounded-[18px] surface-felt text-red-600 border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grain rounded-[16px] p-5 border border-[rgba(47,95,158,0.15)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <h3 className="font-bold text-[#2B2B2B] mb-3">🔄 相关灵感和推荐搜索</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(insp.title)}&type=1`}
            target="_blank" rel="noopener noreferrer"
            className="relative overflow-hidden px-3 py-1.5 text-sm rounded-[18px] surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition"
          >
            📕 小红书搜同款
          </a>
          <a
            href={`https://www.ravelry.com/patterns/search#search=${encodeURIComponent(insp.title)}&view=captioned_grid&sort=best`}
            target="_blank" rel="noopener noreferrer"
            className="relative overflow-hidden px-3 py-1.5 text-sm rounded-[18px] surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition"
          >
            🧶 Ravelry搜同款
          </a>
          <a
            href={`https://www.instagram.com/explore/tags/${encodeURIComponent(insp.title.replace(/\s+/g, ""))}/`}
            target="_blank" rel="noopener noreferrer"
            className="relative overflow-hidden px-3 py-1.5 text-sm rounded-[18px] surface-felt text-[#2B2B2B] border border-[rgba(47,95,158,0.25)] hover:shadow-lg transition"
          >
            📸 Instagram搜同款
          </a>
        </div>
      </div>

      {relatedYarn && (
        <div className="card-grain rounded-[16px] p-5 border border-[rgba(47,95,158,0.15)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <h3 className="font-bold text-[#2B2B2B] mb-3">🧶 关联的毛线</h3>
          <div className="flex items-center gap-4">
            {relatedYarn.photo && <img src={relatedYarn.photo} alt={relatedYarn.name} className="w-16 h-16 object-cover rounded-[16px]" />}
            <div>
              <Link href={`/yarn-detail?id=${relatedYarn.id}`} className="font-semibold text-[#2B2B2B] hover:text-[#2B2B2B] transition">{relatedYarn.name}</Link>
              <div className="flex flex-wrap gap-1 mt-1">
                {relatedYarn.material && <span className="text-xs text-[#6B6B6B]">{relatedYarn.material}</span>}
                {relatedYarn.color && <span className="text-xs text-[#6B6B6B]">· {relatedYarn.color}</span>}
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
