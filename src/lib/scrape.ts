const PROXY_TIMEOUT = 5000;

const CORS_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

const SITE_SUFFIXES = [
  " - 小红书", " | 小红书", " - 抖音", " | 抖音", " - 微博", " | 微博",
  " - Ravelry", " | Ravelry", " - Pinterest", " | Pinterest",
  " - Instagram", " | Instagram", " - Etsy", " | Etsy",
];

export interface ScrapeData {
  title: string;
  images: string[];
  platform: string;
}

export function normalizeScrapeUrl(text: string): string {
  let s = text.trim();
  const match = s.match(/https?:\/\/[^\s\u4e00-\u9fff，。；、]+/i);
  s = match ? match[0] : s;
  return s.replace(/[)\]}>"'，。；、]+$/g, "");
}

export const cleanUrl = normalizeScrapeUrl;

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("xiaohongshu") || host.includes("xhslink") || host.includes("xhscdn")) return "小红书";
    if (host.includes("ravelry")) return "Ravelry";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("pinterest")) return "Pinterest";
    if (host.includes("etsy")) return "Etsy";
    if (host.includes("bilibili") || host.includes("b23")) return "B站";
  } catch {}
  return "";
}

function isLikelyXhsDefaultImage(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("xiaohongshu.com/favicon") ||
    lower.includes("xiaohongshu.com/logo") ||
    lower.includes("xhs-pc-web") ||
    lower.includes("official") ||
    lower.includes("static") && lower.includes("xiaohongshu")
  );
}

function addImageUnique(
  images: string[],
  seen: Set<string>,
  src: unknown,
  baseUrl: string,
  options?: { xhsContentOnly?: boolean }
): void {
  if (typeof src !== "string") return;
  const raw = decodeHtml(src);
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return;

  let resolved: string;
  try {
    resolved = raw.startsWith("http")
      ? raw
      : raw.startsWith("//")
        ? `https:${raw}`
        : new URL(raw, baseUrl).href;
  } catch {
    return;
  }

  if (resolved.startsWith("http://") && resolved.toLowerCase().includes("xhscdn.com")) {
    resolved = `https://${resolved.slice("http://".length)}`;
  }

  const lower = resolved.toLowerCase();
  if (
    seen.has(resolved) ||
    lower.endsWith(".svg") ||
    lower.includes("avatar") ||
    lower.includes("logo") ||
    lower.includes("favicon") ||
    lower.includes("placeholder") ||
    (options?.xhsContentOnly && (!lower.includes("xhscdn.com") || isLikelyXhsDefaultImage(resolved)))
  ) return;

  seen.add(resolved);
  images.push(resolved);
}

function walkJsonImages(
  value: unknown,
  images: string[],
  seen: Set<string>,
  baseUrl: string,
  options?: { xhsContentOnly?: boolean }
): void {
  if (!value || images.length >= 12) return;
  if (typeof value === "string") {
    if (/^https?:\/\/|^\/\//.test(value) && /\.(jpe?g|png|webp|avif)(\?|$)/i.test(value)) {
      addImageUnique(images, seen, value, baseUrl, options);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => walkJsonImages(item, images, seen, baseUrl, options));
    return;
  }
  if (typeof value !== "object") return;

  const obj = value as Record<string, unknown>;
  for (const key of ["urlDefault", "urlPre", "url", "src", "image", "imageUrl", "image_url", "thumbnail", "thumbnail_url", "photo"]) {
    const item = obj[key];
    if (typeof item === "string") addImageUnique(images, seen, item, baseUrl, options);
    else walkJsonImages(item, images, seen, baseUrl, options);
  }
  for (const item of Object.values(obj)) walkJsonImages(item, images, seen, baseUrl, options);
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    try {
      return JSON.parse(value.replace(/:undefined/g, ":null").replace(/:NaN/g, ":null"));
    } catch {
      return null;
    }
  }
}

function extractJsonObjectAfter(html: string, marker: string): unknown {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;
  const eqIndex = html.indexOf("=", markerIndex);
  const startBrace = html.indexOf("{", eqIndex === -1 ? markerIndex : eqIndex);
  if (startBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (let i = startBrace; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) inString = false;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      inString = true;
      quote = ch;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return safeJsonParse(html.slice(startBrace, i + 1));
    }
  }
  return null;
}

function extractTitle(html: string, url: string): string {
  const metaTitle = html.match(/<meta\s+[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*>/i);
  let title = metaTitle ? decodeHtml(metaTitle[1]) : "";

  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) title = decodeHtml(titleMatch[1].replace(/<[^>]+>/g, ""));
  }

  if (!title) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) title = decodeHtml(h1[1].replace(/<[^>]+>/g, ""));
  }

  for (const suffix of SITE_SUFFIXES) {
    if (title.endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
  }
  title = title.replace(/^(?:Ravelry|Instagram|Pinterest|Etsy|YouTube|Twitter):\s*/i, "");

  if (!title) {
    try {
      const path = decodeURIComponent(new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "");
      if (path && path.length > 2 && !path.includes(".")) title = path.replace(/[-_]+/g, " ");
    } catch {}
  }

  return title;
}

function extractMetaImages(html: string, url: string, images: string[], seen: Set<string>): void {
  const metaImgRe = /<meta\s+[^>]*(?:(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'])[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaImgRe.exec(html)) !== null) {
    addImageUnique(images, seen, match[1] || match[2], url);
  }
}

function extractStructuredImages(html: string, url: string, images: string[], seen: Set<string>): void {
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = ldRe.exec(html)) !== null) {
    const json = safeJsonParse(decodeHtml(match[1]));
    walkJsonImages(json, images, seen, url);
  }

  const nextMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextMatch) walkJsonImages(safeJsonParse(decodeHtml(nextMatch[1])), images, seen, url);

  const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*([\s\S]*?);<\/script>/i);
  if (nuxtMatch) walkJsonImages(safeJsonParse(nuxtMatch[1]), images, seen, url);
}

function extractXhsImages(html: string, url: string, images: string[], seen: Set<string>): string {
  let title = "";
  const state = extractJsonObjectAfter(html, "window.__INITIAL_STATE__");
  if (state && typeof state === "object") {
    const noteMap = (state as any)?.note?.noteDetailMap;
    if (noteMap && typeof noteMap === "object") {
      for (const item of Object.values(noteMap)) {
        const note = (item as any)?.note;
        if (!note) continue;
        title = note.title || note.displayTitle || title;
        walkJsonImages(note.imageList, images, seen, url, { xhsContentOnly: true });
      }
    }
    if (images.length === 0) {
      walkJsonImages((state as any)?.note?.noteDetail?.note?.imageList, images, seen, url, { xhsContentOnly: true });
    }
    if (images.length === 0) {
      walkJsonImages(state, images, seen, url, { xhsContentOnly: true });
    }
  }

  const cdnMatches = html.match(/https?:\/\/[^"'\s\\]+xhscdn[^"'\s\\]+/gi) || [];
  cdnMatches.forEach((item) => addImageUnique(images, seen, item.replace(/\\u002F/g, "/"), url, { xhsContentOnly: true }));
  return title;
}

function extractRavelryImages(html: string, url: string, images: string[], seen: Set<string>): void {
  const matches = html.match(/https?:\/\/[^"'\s\\]*(?:ravelrycache|images4-[a-z]+\.ravelrycache|images\.ravelrycache)[^"'\s\\]+/gi) || [];
  matches.forEach((item) => addImageUnique(images, seen, item.replace(/\\u002F/g, "/"), url));
}

function extractImgTags(html: string, url: string, images: string[], seen: Set<string>): void {
  const imgRe = /<img[^>]+(?:src|data-src|data-original|srcset)=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRe.exec(html)) !== null && images.length < 12) {
    const firstSrc = match[1].split(",")[0]?.trim().split(/\s+/)[0];
    addImageUnique(images, seen, firstSrc, url);
  }
}

export function parseHtmlForData(html: string, url: string): ScrapeData {
  const platform = detectPlatform(url);
  const images: string[] = [];
  const seen = new Set<string>();
  let title = "";

  if (/xiaohongshu|xhslink|xhscdn/i.test(url)) {
    title = extractXhsImages(html, url, images, seen) || title;
    if (images.length === 0) {
      extractMetaImages(html, url, images, seen);
      extractStructuredImages(html, url, images, seen);
      if (images.length === 0) extractImgTags(html, url, images, seen);
    }
    title = title || extractTitle(html, url);
    return { title, images: images.slice(0, 8), platform };
  }

  extractMetaImages(html, url, images, seen);
  extractStructuredImages(html, url, images, seen);

  if (platform === "小红书") title = extractXhsImages(html, url, images, seen) || title;
  if (platform === "Ravelry") extractRavelryImages(html, url, images, seen);

  if (images.length === 0) extractImgTags(html, url, images, seen);
  title = title || extractTitle(html, url);

  return { title, images: images.slice(0, 8), platform };
}

async function fetchViaProxy(proxyUrl: string, signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);
  const onParentAbort = signal ? () => controller.abort() : undefined;
  if (signal && onParentAbort) signal.addEventListener("abort", onParentAbort, { once: true });

  return fetch(proxyUrl, { signal: controller.signal, cache: "no-cache" })
    .then((res) => {
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json") || proxyUrl.includes("/get?")) {
        return res.json().then((json) =>
          typeof json === "string" ? json : json.contents || json.body || ""
        );
      }
      return res.text();
    })
    .catch(() => null)
    .finally(() => {
      clearTimeout(timeoutId);
      if (onParentAbort) signal?.removeEventListener("abort", onParentAbort);
    });
}

export async function scrapeUrl(url: string, signal?: AbortSignal): Promise<ScrapeData> {
  const normalized = normalizeScrapeUrl(url);
  const platform = detectPlatform(normalized);

  try {
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: normalized }),
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.title || data.images?.length) return data;
    }
  } catch {}

  const results = await Promise.allSettled(
    CORS_PROXIES.map((proxy) => fetchViaProxy(proxy(normalized), signal))
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value && result.value.length > 100) {
      const data = parseHtmlForData(result.value, normalized);
      if (data.title || data.images.length > 0) return data;
    }
  }

  return { title: "", images: [], platform };
}
