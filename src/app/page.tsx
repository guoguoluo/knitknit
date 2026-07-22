"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useYarnStore, useInspirationStore } from "@/lib/store";
import { useTexts } from "@/lib/language";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Bubble {
  id: string;
  type: "yarn" | "inspiration";
  label: string;
  color: string;
  image: string | null;
  href: string;
  baseX: number;
  baseY: number;
  r: number;
  floatPhase: number;
  floatSpeed: number;
  amp: number;
}

const GAP = 6;
const AMP = 6;
const RETURN_DELAY = 3000;
const RETURN_SPEED = 0.04;
const TITLE_Y = 40;
const MIN_FONT = 8;
const MAX_R = 48;
const MIN_R = 12;

function getBubbleRadius(
  item: { type: string; hasYarn?: boolean },
  baseR: number
): number {
  if (item.type === "yarn") return baseR;
  if (item.hasYarn) return baseR;
  return Math.max(MIN_R, Math.round(baseR * 0.6));
}

function scatterBubbles(
  items: Array<{ id: string; type: "yarn" | "inspiration"; label: string; color: string; image: string | null; href: string; hasYarn?: boolean }>,
  canvasW: number,
  availH: number,
  baseR: number
): Bubble[] {
  if (items.length === 0) return [];
  const result: Bubble[] = [];
  const margin = 20;
  const topY = TITLE_Y + 20;
  const bottomY = Math.max(topY + baseR * 2 + margin, availH - margin);
  const leftHalf = canvasW / 2;

  for (const item of items) {
    const r = getBubbleRadius(item, baseR);
    let x: number, y: number;
    if (item.type === "yarn") {
      x = margin + Math.random() * Math.max(1, leftHalf - margin * 2);
    } else {
      x = leftHalf + Math.random() * Math.max(1, canvasW - leftHalf - margin * 2);
    }
    y = topY + Math.random() * Math.max(1, bottomY - topY);

    result.push({
      ...item,
      baseX: x, baseY: y,
      r,
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.6,
      amp: AMP * (0.7 + Math.random() * 0.6),
    });
  }

  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        // skip cross-half pairs
        if ((a.baseX <= leftHalf && b.baseX >= leftHalf) || (b.baseX <= leftHalf && a.baseX >= leftHalf)) continue;
        const dx = b.baseX - a.baseX;
        const dy = b.baseY - a.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + GAP;
        if (dist < minDist && dist > 0.01) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const push = 0.5;
          a.baseX -= nx * overlap * push;
          a.baseY -= ny * overlap * push;
          b.baseX += nx * overlap * push;
          b.baseY += ny * overlap * push;
        }
      }
      const side = result[i].baseX <= leftHalf ? 0 : leftHalf;
      const sideW = side === 0 ? leftHalf : canvasW - leftHalf;
      result[i].baseX = Math.max(side + margin, Math.min(side + sideW - margin, result[i].baseX));
      result[i].baseY = Math.max(topY, Math.min(bottomY, result[i].baseY));
    }
  }

  return result;
}

export default function Home() {
  const texts = useTexts();
  const router = useRouter();
  const { yarns, fetchYarns } = useYarnStore();
  const { inspirations, fetchInspirations } = useInspirationStore();
  const bubbleAreaRef = useRef<HTMLDivElement | null>(null);
  const [areaSize, setAreaSize] = useState({ w: 600, h: 420 });
  const [time, setTime] = useState(0);
  const dragOffsets = useRef<Map<string, { ox: number; oy: number; returnTime: number | null }>>(new Map());
  const [tick, setTick] = useState(0);
  const wasDragging = useRef(false);
  const navigated = useRef(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinchRef = useRef<{ dist0: number; scale0: number } | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const updateSize = () => {
      const rect = bubbleAreaRef.current?.getBoundingClientRect();
      setAreaSize({
        w: Math.max(320, Math.round(rect?.width || window.innerWidth || 600)),
        h: Math.max(240, Math.round(rect?.height || 420)),
      });
    };
    updateSize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSize) : null;
    if (bubbleAreaRef.current && observer) observer.observe(bubbleAreaRef.current);
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
    };
  }, []);

  useEffect(() => {
    fetchYarns();
    fetchInspirations();
  }, [fetchYarns, fetchInspirations]);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setTime((t) => t + 0.016);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      let changed = false;
      const now = Date.now();
      dragOffsets.current.forEach((o) => {
        if (o.returnTime === null) return;
        if (now < o.returnTime) return;
        const dist = Math.sqrt(o.ox * o.ox + o.oy * o.oy);
        if (dist < 0.5) {
          o.ox = 0; o.oy = 0; o.returnTime = null;
        } else {
          const step = Math.max(1, dist * RETURN_SPEED);
          const f = step / dist;
          o.ox -= o.ox * f;
          o.oy -= o.oy * f;
        }
        changed = true;
      });
      if (changed) setTick((t) => t + 1);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const linkedYarnIds = useMemo(() => new Set(inspirations.filter((i) => i.yarn_id !== null).map((i) => i.yarn_id)), [inspirations]);
  const linkedYarns = useMemo(() => yarns.filter((y) => linkedYarnIds.has(y.id)), [yarns, linkedYarnIds]);

  const links = useMemo(() => {
    return inspirations.filter((i) => i.yarn_id !== null).map((i) => ({ yarnId: i.yarn_id!, inspId: i.id }));
  }, [inspirations]);

  const isLargeBase64 = (s: string | null | undefined): boolean => {
    if (!s) return true;
    if (s.startsWith("data:") && s.length > 5000) return true;
    return false;
  };

  const bubbleImage = useCallback((value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed || failedImages.has(trimmed)) return null;
    return trimmed;
  }, [failedImages]);

  const markImageFailed = useCallback((value: string | null) => {
    if (!value) return;
    setFailedImages((prev) => {
      if (prev.has(value)) return prev;
      const next = new Set(prev);
      next.add(value);
      return next;
    });
  }, []);

  const yarnItems = useMemo(() => linkedYarns.map((y) => ({
    id: `y-${y.id}`, type: "yarn" as const, label: y.name,
    color: y.color || "#e5e7eb", image: isLargeBase64(y.photo) ? null : y.photo, href: `/yarn-detail?id=${y.id}`,
    hasYarn: true,
  })), [linkedYarns]);

  const linkedInspItems = useMemo(() => inspirations
    .filter(i => i.yarn_id !== null)
    .map((i) => ({
      id: `i-${i.id}`, type: "inspiration" as const, label: i.title,
      color: "#f0abfc", image: bubbleImage(i.image),
      href: `/inspiration-detail?id=${i.id}`, hasYarn: true,
  })), [inspirations, bubbleImage]);

  const unlinkedInspItems = useMemo(() => inspirations
    .filter(i => i.yarn_id === null)
    .map((i) => ({
      id: `i-${i.id}`, type: "inspiration" as const, label: i.title,
      color: "#f0abfc", image: bubbleImage(i.image),
      href: `/inspiration-detail?id=${i.id}`, hasYarn: false,
  })), [inspirations, bubbleImage]);

  const totalItems = yarnItems.length + linkedInspItems.length + unlinkedInspItems.length;

  const availW = areaSize.w;
  const availH = areaSize.h;

  const canvasWidth = availW;
  const canvasHeight = Math.max(availH, 200);

  const r = useMemo(() => {
    const base = Math.max(canvasWidth, canvasHeight);
    let rr = Math.round(base * 0.055);
    rr = Math.max(MIN_R, Math.min(MAX_R, rr));
    if (totalItems > 10) rr = Math.max(MIN_R, Math.round(rr * 10 / totalItems));
    return rr;
  }, [canvasWidth, canvasHeight, totalItems]);

  const allBubbles = useMemo(() => {
    if (yarnItems.length === 0 && linkedInspItems.length === 0 && unlinkedInspItems.length === 0) return [];
    const allItems = [...yarnItems, ...linkedInspItems, ...unlinkedInspItems];
    return scatterBubbles(allItems, canvasWidth, availH, r);
  }, [yarnItems, linkedInspItems, unlinkedInspItems, canvasWidth, availH, r]);

  const svgHeight = useMemo(() => {
    if (allBubbles.length === 0) return canvasHeight;
    const maxY = Math.max(...allBubbles.map((b) => b.baseY + b.r + AMP));
    return Math.max(canvasHeight, maxY + 40);
  }, [allBubbles, canvasHeight]);

  const bubbles = useMemo((): Bubble[] => {
    return allBubbles.map((b) => {
      const o = dragOffsets.current.get(b.id) || { ox: 0, oy: 0, returnTime: null };
      const floatY = Math.sin(time * b.floatSpeed + b.floatPhase) * b.amp;
      const x = Math.max(b.r, Math.min(canvasWidth - b.r, b.baseX + o.ox));
      const y = Math.max(TITLE_Y + 16 + b.r, Math.min(svgHeight - b.r, b.baseY + o.oy + floatY));
      return { ...b, baseX: x, baseY: y };
    });
  }, [allBubbles, time, tick, canvasWidth, svgHeight]);

  const bubblesMap = useMemo(() => {
    const map = new Map<string, Bubble>();
    for (const b of bubbles) { map.set(b.id, b); }
    return map;
  }, [bubbles]);

  const linkLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (const l of links) {
      const yB = bubblesMap.get(`y-${l.yarnId}`);
      const iB = bubblesMap.get(`i-${l.inspId}`);
      if (yB && iB) lines.push({ x1: yB.baseX, y1: yB.baseY, x2: iB.baseX, y2: iB.baseY });
    }
    return lines;
  }, [links, bubblesMap]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY }), []);

  const hoveredBubble = hoveredId ? bubblesMap.get(hoveredId) : null;
  const textFontSize = Math.max(8, Math.round(r * 0.24));
  const showBubbleText = r >= MIN_FONT && textFontSize >= MIN_FONT;

  const pushOthers = useCallback((dragId: string, dx: number, dy: number) => {
    const dragBubble = allBubbles.find((b) => b.id === dragId);
    if (!dragBubble) return;
    const newX = dragBubble.baseX + dx;
    const newY = dragBubble.baseY + dy;
    const minDist = dragBubble.r * 2 + GAP;
    for (const b of allBubbles) {
      if (b.id === dragId) continue;
      const o = dragOffsets.current.get(b.id) || { ox: 0, oy: 0, returnTime: null };
      let bx = b.baseX + o.ox;
      let by = b.baseY + o.oy;
      const dist = Math.sqrt((bx - newX) ** 2 + (by - newY) ** 2);
      if (dist < minDist && dist > 0.01) {
        const overlap = (minDist - dist) * 0.5;
        const nx = (bx - newX) / dist;
        const ny = (by - newY) / dist;
        bx += nx * overlap;
        by += ny * overlap;
        o.ox = Math.max(-b.baseX + b.r, Math.min(canvasWidth - b.r - b.baseX, bx - b.baseX));
        o.oy = Math.max(-b.baseY + TITLE_Y + 16 + b.r, Math.min(svgHeight - b.r - b.baseY, by - b.baseY));
        o.returnTime = null;
        dragOffsets.current.set(b.id, o);
      }
    }
  }, [allBubbles, canvasWidth, svgHeight]);

  const onBubblePointerDown = useCallback((e: React.PointerEvent, bubbleId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    wasDragging.current = false;
    navigated.current = false;
    const b = allBubbles.find((x) => x.id === bubbleId);
    if (!b) return;
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const o = dragOffsets.current.get(b.id) || { ox: 0, oy: 0, returnTime: null };
    o.returnTime = null;
    dragOffsets.current.set(b.id, o);
    draggingRef.current = { id: b.id, startX: e.clientX, startY: e.clientY, origX: o.ox, origY: o.oy };
    svg.setPointerCapture(e.pointerId);
  }, [allBubbles]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = draggingRef.current;
    if (drag) {
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) wasDragging.current = true;
      let ndx = dx + drag.origX;
      let ndy = dy + drag.origY;
      const b = allBubbles.find((x) => x.id === drag.id);
      if (b) {
        ndx = Math.max(-b.baseX + b.r, Math.min(canvasWidth - b.r - b.baseX, ndx));
        ndy = Math.max(-b.baseY + TITLE_Y + 16 + b.r, Math.min(svgHeight - b.r - b.baseY, ndy));
      }
      dragOffsets.current.set(drag.id, { ox: ndx, oy: ndy, returnTime: null });
      pushOthers(drag.id, ndx, ndy);
      setTick((t) => t + 1);
      return;
    }
    const ps = panStart.current;
    if (ps) {
      const dx = e.clientX - ps.x;
      const dy = e.clientY - ps.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) wasDragging.current = true;
      setPan({ x: ps.px + dx, y: ps.py + dy });
    }
  }, [pushOthers, allBubbles, canvasWidth, svgHeight, scale]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const drag = draggingRef.current;
    if (drag) {
      const svg = e.currentTarget;
      svg.releasePointerCapture(e.pointerId);
      const o = dragOffsets.current.get(drag.id);
      if (o && (o.ox !== 0 || o.oy !== 0)) {
        o.returnTime = Date.now() + RETURN_DELAY;
        dragOffsets.current.set(drag.id, o);
      }
      if (!wasDragging.current && !navigated.current) {
        const b = allBubbles.find((x) => x.id === drag.id);
        if (b) {
          navigated.current = true;
          router.push(b.href);
        }
      }
      draggingRef.current = null;
      return;
    }
    panStart.current = null;
  }, [router, allBubbles]);

  const handleClickNav = useCallback((href: string) => {
    if (!wasDragging.current && !navigated.current) {
      navigated.current = true;
      router.push(href);
    }
  }, [router]);

  const onSvgPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget && (e.target as Element).closest("g")) return;
    wasDragging.current = false;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.3, Math.min(3, s * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist0: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), scale0: scale };
    }
  }, [scale]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(Math.max(0.3, Math.min(3, pinchRef.current.scale0 * (dist / pinchRef.current.dist0))));
    }
  }, []);

  const onTouchEnd = useCallback(() => { pinchRef.current = null; }, []);

  return (
    <div className="homeSurface h-full flex flex-col">
      {/* title bar */}
      <section className="text-center shrink-0 px-2 pt-2 pb-0">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 leading-tight">
          {texts.homeHeading}
        </h1>
        <p className="text-gray-500 text-xs leading-relaxed">
          {texts.homeStats(linkedYarns.length, inspirations.length)}
        </p>
      </section>

      {/* full-viewport bubble area */}
      <div ref={bubbleAreaRef} className="bubble-bg flex-1 min-h-[240px] relative overflow-hidden" onWheel={onWheel}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {inspirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="text-6xl mb-4 opacity-70">🧶</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{texts.homeEmptyTitle}</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">{texts.homeEmptyBody}</p>
            <Link href="/inspirations" className="btnPatch btnPatch--coffee">
              {texts.inspListAdd}
            </Link>
          </div>
        ) : bubbles.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width={canvasWidth}
              height={svgHeight}
              className="block overflow-visible"
              style={{
                touchAction: "none",
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
              onMouseMove={onMouseMove}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerDown={onSvgPointerDown}
            >
              <defs>
                <filter id="yarnShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx={0} dy={6} stdDeviation={12} floodColor="rgba(0,0,0,0.2)" />
                </filter>
                <filter id="feltShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx={0} dy={4} stdDeviation={8} floodColor="rgba(0,0,0,0.12)" />
                </filter>
                <pattern id="feltPattern" patternUnits="userSpaceOnUse" width={128} height={128}>
                  <image href="texture/felt-cream-1024.png" width={128} height={128} preserveAspectRatio="xMidYMid slice" />
                </pattern>
                <pattern id="feltPinkPattern" patternUnits="userSpaceOnUse" width={128} height={128}>
                  <image href="texture/felt-pink-1024.png" width={128} height={128} preserveAspectRatio="xMidYMid slice" />
                </pattern>
                <pattern id="stitchPattern" patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(18)">
                  <path d="M 0 6 L 8 6" stroke="rgba(104,78,116,0.38)" strokeWidth="2" strokeLinecap="round" />
                </pattern>
              </defs>



              {linkLines.map((line, idx) => {
                const midX = (line.x1 + line.x2) / 2;
                const midY = (line.y1 + line.y2) / 2 - 18;
                const d = `M ${line.x1} ${line.y1} Q ${midX} ${midY} ${line.x2} ${line.y2}`;
                return (
                  <g key={idx}>
                    <path d={d} fill="none" stroke="rgba(80,61,89,0.12)" strokeWidth={8} strokeLinecap="round" />
                    <path d={d} fill="none" stroke="url(#stitchPattern)" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
                    <path d={d} fill="none" stroke="rgba(112,82,122,0.28)" strokeWidth={1.2} strokeDasharray="5 8" strokeLinecap="round" />
                  </g>
                );
              })}

              {bubbles.map((b) => {
                return (
                <g
                  key={b.id}
                  className="cursor-pointer"
                  transform={hoveredId === b.id ? `translate(${b.baseX} ${b.baseY}) scale(1.08) translate(${-b.baseX} ${-b.baseY})` : undefined}
                  style={{
                    opacity: hoveredId && hoveredId !== b.id ? 0.42 : 1,
                    transition: "opacity 180ms ease, transform 180ms ease",
                  }}
                  onMouseEnter={() => setHoveredId(b.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleClickNav(b.href)}
                  onPointerDown={(e) => onBubblePointerDown(e, b.id)}
                >
                  {b.type === "yarn" ? (
                    <>
                      <clipPath id={`cy-${b.id}`}><circle cx={b.baseX} cy={b.baseY} r={b.r} /></clipPath>
                      <circle cx={b.baseX} cy={b.baseY} r={b.r} fill="url(#feltPattern)" filter="url(#yarnShadow)" />
                      <circle cx={b.baseX} cy={b.baseY} r={b.r} fill={b.color || "#c4956a"} fillOpacity={0.48} />
                      <circle cx={b.baseX - b.r * 0.22} cy={b.baseY - b.r * 0.24} r={b.r * 0.46} fill="rgba(255,255,255,0.22)" />
                      {b.image ? (
                        <image key={`${b.id}-${b.image.slice(0, 48)}`} href={b.image} x={b.baseX - b.r} y={b.baseY - b.r} width={b.r * 2} height={b.r * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#cy-${b.id})`} opacity={hoveredId === b.id ? 0.72 : 0.18} onError={() => markImageFailed(b.image)} />
                      ) : null}
                      <circle cx={b.baseX} cy={b.baseY} r={b.r - 2} fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth={2.2} strokeDasharray="2 5" strokeLinecap="round" />
                      <circle cx={b.baseX} cy={b.baseY} r={b.r} fill="none" stroke="rgba(82,62,74,0.16)" strokeWidth={1.5} />
                      {showBubbleText && (
                        <text x={b.baseX} y={b.baseY + Math.round(textFontSize * 0.4)} textAnchor="middle" fill="#2B2B2B" fontSize={textFontSize} fontWeight="bold" style={{ textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}>
                          {b.label.length > 8 ? b.label.slice(0, 7) + "…" : b.label}
                        </text>
                      )}
                    </>
                  ) : (
                    <>
                      <rect x={b.baseX - b.r} y={b.baseY - b.r} width={b.r * 2} height={b.r * 2} rx={Math.max(8, Math.round(r * 0.32))} fill="url(#feltPinkPattern)" filter="url(#feltShadow)" />
                      <rect x={b.baseX - b.r} y={b.baseY - b.r} width={b.r * 2} height={b.r * 2} rx={Math.max(8, Math.round(r * 0.32))} fill="rgba(255,250,241,0.54)" />
                      {b.image ? (
                        <>
                          <clipPath id={`ci-${b.id}`}><rect x={b.baseX - b.r} y={b.baseY - b.r} width={b.r * 2} height={b.r * 2} rx={Math.max(8, Math.round(r * 0.32))} /></clipPath>
                          <image key={`${b.id}-${b.image.slice(0, 48)}`} href={b.image} x={b.baseX - b.r} y={b.baseY - b.r} width={b.r * 2} height={b.r * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#ci-${b.id})`} opacity={hoveredId === b.id ? 0.78 : 0.22} onError={() => markImageFailed(b.image)} />
                        </>
                      ) : null}
                      <rect x={b.baseX - b.r + 2} y={b.baseY - b.r + 2} width={b.r * 2 - 4} height={b.r * 2 - 4} rx={Math.max(8, Math.round(r * 0.28))} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeDasharray="3 5" />
                      <rect x={b.baseX - b.r} y={b.baseY - b.r} width={b.r * 2} height={b.r * 2} rx={Math.max(8, Math.round(r * 0.32))} fill="none" stroke="rgba(88,64,98,0.18)" strokeWidth={1.5} />
                      {showBubbleText && (
                        <text x={b.baseX} y={b.baseY + Math.round(textFontSize * 0.35)} textAnchor="middle" fill="#2B2B2B" fontSize={textFontSize} fontWeight="bold" style={{ textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}>
                          {b.label.length > 8 ? b.label.slice(0, 7) + "…" : b.label}
                        </text>
                      )}
                    </>
                  )}
                </g>
                );
              })}
            </svg>
          </div>
        )}

        {hoveredBubble && (
          <div className="felt-card fixed z-50 px-3 py-2 pointer-events-none max-w-[180px]" style={{
            left: Math.min(mousePos.x + 14, window.innerWidth - 160),
            top: Math.max(mousePos.y - 50, 8),
          }}>
            {hoveredBubble.image && (
              <img src={hoveredBubble.image} alt={hoveredBubble.label} className="w-full h-20 object-cover rounded-lg mb-1.5" referrerPolicy="no-referrer" onError={() => markImageFailed(hoveredBubble.image)} />
            )}
            <div className="flex items-center gap-1.5">
              {hoveredBubble.type === "yarn" ? (
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hoveredBubble.color }} />
              ) : (
                <span className="text-sm">💡</span>
              )}
              <span className="text-sm font-medium text-[#2B2B2B] truncate">{hoveredBubble.label}</span>
            </div>
            <div className="text-[10px] text-[#6B6B6B] mt-0.5">
              {hoveredBubble.type === "yarn" ? texts.homeYarnTooltip : texts.homeInspTooltip}
            </div>
          </div>
        )}
      </div>

      {/* action buttons */}
      <section className="text-center shrink-0 pb-3 sm:pb-4 pt-0 px-3">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <Link href="/yarns" className="btnPatch btnPatch--white">
            {texts.homeManageYarns}
          </Link>
          <Link href="/inspirations" className="btnPatch btnPatch--coffee">
            {texts.homeBrowseInspirations}
          </Link>
        </div>
      </section>
    </div>
  );
}
