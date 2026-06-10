const PROXY_TIMEOUT = 5000;

const CORS_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
];

const SITE_SUFFIXES = [
  " - 小红书", " - 抖音", " - 微博", " - 知乎", " - Bilibili",
  " - Instagram", " - Ravelry", " - Pinterest", " - Etsy",
  " - YouTube", " - Twitter", " - Facebook",
  " | 小红书", " | 抖音", " | 微博", " | 知乎", " | Bilibili",
];

export function cleanUrl(text: string): string {
  let s = text.replace(/^[\u4e00-\u9fff\s]+/, "").trim();
  const m = s.match(/https?:\/\/[^\s\u4e00-\u9fff]+/);
  return m ? m[0] : s;
}

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "").toLowerCase();
    if (host.includes("xiaohongshu") || host.includes("xhslink") || host.includes("xhscdn")) return "小红书";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("ravelry")) return "Ravelry";
    if (host.includes("pinterest")) return "Pinterest";
    if (host.includes("etsy")) return "Etsy";
    if (host.includes("bilibili") || host.includes("b23")) return "B站";
  } catch {}
  return "";
}

function addImage(images: string[], seen: Set<string>, src: string, baseUrl: string): void {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
  let resolved: string;
  try {
    resolved = src.startsWith("http") ? src : src.startsWith("//") ? "https:" + src : new URL(src, baseUrl).href;
  } catch { return; }
  if (!resolved || seen.has(resolved)) return;
  const lower = resolved.toLowerCase();
  if (lower.includes("avatar") || lower.includes("icon") || lower.includes("logo") || lower.endsWith(".svg")) return;
  seen.add(resolved);
  images.push(resolved);
}

function extractTitle(html: string): string {
  const ogTitle = html.match(/<meta\s+[^>]*(?:property=["']og:title["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']og:title["'])/i);
  if (ogTitle) return ogTitle[1] || ogTitle[2];

  const twTitle = html.match(/<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  if (twTitle) return twTitle[1];

  const tMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (tMatch) {
    let t = tMatch[1].trim();
    for (const suffix of SITE_SUFFIXES) {
      if (t.endsWith(suffix)) { t = t.slice(0, -suffix.length).trim(); break; }
    }
    return t;
  }

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function extractImages(html: string, url: string, platform: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  if (platform === "小红书") {
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\});\s*(?:<\/script>|window\.)/);
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const note = state?.note?.noteDetail?.note;
        if (note?.imageList?.length > 0) {
          for (const img of note.imageList) {
            addImage(images, seen, img.urlDefault || img.url || img.infoList?.[0]?.url, url);
          }
          if (images.length > 0) return images.slice(0, 5);
        }
      } catch {}
    }
    const cdnMatch = html.match(/https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s,]+/g);
    if (cdnMatch) {
      for (const u of cdnMatch) addImage(images, seen, u, url);
      if (images.length > 0) return images.slice(0, 5);
    }
  }

  const metaImgRe = /<meta\s+[^>]*(?:(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["'])/gi;
  let m: RegExpExecArray | null;
  while ((m = metaImgRe.exec(html)) !== null) {
    addImage(images, seen, m[1] || m[2], url);
    if (images.length >= 2) break;
  }

  if (images.length === 0 && platform === "小红书") {
    const ciUrls = html.match(/https?:\/\/ci\.xhscdn\.com\/[^"'\s,]+/g);
    if (ciUrls) for (const u of ciUrls) addImage(images, seen, u, url);
  }

  if (images.length === 0) {
    const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (ldMatch) {
      try {
        const d = JSON.parse(ldMatch[1]);
        const extract = (obj: any) => {
          if (!obj || typeof obj !== "object") return;
          if (obj.image) {
            if (typeof obj.image === "string") addImage(images, seen, obj.image, url);
            else if (Array.isArray(obj.image)) obj.image.forEach((i: any) => { if (typeof i === "string") addImage(images, seen, i, url); });
          }
          for (const v of Object.values(obj)) extract(v);
        };
        extract(d);
      } catch {}
    }
  }

  if (images.length === 0) {
    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((m = imgRe.exec(html)) !== null) {
      addImage(images, seen, m[1], url);
      if (images.length >= 1) break;
    }
  }

  return images.slice(0, 5);
}

function parseHtmlForData(html: string, url: string): { title: string; images: string[]; platform: string } {
  const platform = detectPlatform(url);
  const title = extractTitle(html);
  const images = extractImages(html, url, platform);
  return { title, images, platform };
}

function fetchViaProxy(proxyUrl: string, signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);
  const combinedSignal = signal ?? controller.signal;

  const onParentAbort = signal ? () => controller.abort() : undefined;
  if (onParentAbort) signal!.addEventListener("abort", onParentAbort, { once: true });

  return fetch(proxyUrl, { signal: combinedSignal, cache: "no-cache" })
    .then(res => {
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json") || proxyUrl.includes("/get?")) {
        return res.json().then(json =>
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

function extractRavelryInfo(url: string): { title: string; pageUrl: string } | null {
  try {
    const host = new URL(url).hostname.replace("www.", "").toLowerCase();
    if (!host.includes("ravelry")) return null;
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const libIdx = parts.indexOf("library");
    if (libIdx >= 0 && libIdx + 1 < parts.length) {
      const slug = parts[libIdx + 1];
      const title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      return { title, pageUrl: url };
    }
  } catch {}
  return null;
}

export interface ScrapeResult {
  title: string;
  images: string[];
  platform: string;
  partial?: boolean;
  pageUrl?: string;
}

export async function scrapeUrl(url: string, signal?: AbortSignal): Promise<ScrapeResult> {
  const platform = detectPlatform(url);
  const proxyUrls = CORS_PROXIES.map(fn => fn(url));

  const results = await Promise.allSettled(
    proxyUrls.map(proxyUrl => fetchViaProxy(proxyUrl, signal))
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value && result.value.length > 100) {
      const data = parseHtmlForData(result.value, url);
      if (data.title || data.images.length > 0) return { ...data, platform };
    }
  }

  // Fallback for Ravelry: extract pattern name from URL
  const ravelry = extractRavelryInfo(url);
  if (ravelry) {
    return { title: ravelry.title, images: [], platform, partial: true, pageUrl: ravelry.pageUrl };
  }

  return { title: "", images: [], platform };
}
