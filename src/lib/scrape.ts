const PROXY_TIMEOUT = 5000;

const CORS_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
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

function addImageUnique(images: string[], seen: Set<string>, src: string, baseUrl: string): void {
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

function extractXHSData(html: string, url: string): { title: string; images: string[] } | null {
  const images: string[] = [];
  const seen = new Set<string>();
  let title = "";

  const initIdx = html.indexOf("window.__INITIAL_STATE__");
  if (initIdx === -1) return null;

  const eqIdx = html.indexOf("=", initIdx);
  if (eqIdx === -1) return null;

  let start = eqIdx + 1;
  while (start < html.length && " \t\n\r".includes(html[start])) start++;

  let depth = 0;
  let end = start;
  for (; end < html.length; end++) {
    if (html[end] === "{") depth++;
    else if (html[end] === "}") { depth--; if (depth === 0) break; }
  }

  let jsonStr = html.substring(start, end + 1);
  jsonStr = jsonStr.replace(/:undefined/g, ":null").replace(/:NaN/g, ":null");

  try {
    const state = JSON.parse(jsonStr);
    let noteData: any = null;

    // Try state.note.noteDetailMap[{noteId}]
    if (state?.note?.noteDetailMap) {
      for (const noteId of Object.keys(state.note.noteDetailMap)) {
        const nd = state.note.noteDetailMap[noteId];
        if (nd?.note && Object.keys(nd.note).length > 0) {
          noteData = nd.note;
          break;
        }
      }
    }

    // Try state.note.noteDetail.note (legacy)
    if (!noteData) {
      noteData = state?.note?.noteDetail?.note;
    }

    if (noteData) {
      title = noteData.title || noteData.displayTitle || "";
      if (noteData.imageList) {
        for (const img of noteData.imageList) {
          const src = img.urlDefault || img.url || img.infoList?.[0]?.url;
          if (src) addImageUnique(images, seen, src, url);
        }
      }
    }

    // CDN fallback
    if (images.length === 0) {
      const cdnMatch = html.match(/https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s,]+/g);
      if (cdnMatch) for (const u of cdnMatch) addImageUnique(images, seen, u, url);
    }
    if (images.length === 0) {
      const ciMatch = html.match(/https?:\/\/ci\.xhscdn\.com\/[^"'\s,]+/g);
      if (ciMatch) for (const u of ciMatch) addImageUnique(images, seen, u, url);
    }

    return { title, images: images.slice(0, 5) };
  } catch { return null; }
}

function extractGenericData(html: string, url: string): { title: string; images: string[] } {
  const images: string[] = [];
  const seen = new Set<string>();

  // og:image + twitter:image (both orderings, single pass)
  const metaImgRe = /<meta\s+[^>]*(?:(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["'])/gi;
  let m: RegExpExecArray | null;
  while ((m = metaImgRe.exec(html)) !== null) {
    addImageUnique(images, seen, m[1] || m[2], url);
  }

  // JSON-LD
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const d = JSON.parse(ldMatch[1]);
      const extract = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (obj.image) {
          if (typeof obj.image === "string") addImageUnique(images, seen, obj.image, url);
          else if (Array.isArray(obj.image)) obj.image.forEach((i: any) => { if (typeof i === "string") addImageUnique(images, seen, i, url); });
        }
        for (const v of Object.values(obj)) extract(v);
      };
      extract(d);
    } catch {}
  }

  // <img> tags (last resort)
  if (images.length === 0) {
    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((m = imgRe.exec(html)) !== null) {
      addImageUnique(images, seen, m[1], url);
      if (images.length >= 2) break;
    }
  }

  // Title extraction
  let title = "";

  // og:title (both orderings)
  const ogTitle = html.match(/<meta\s+[^>]*(?:property=["']og:title["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']og:title["'])/i);
  if (ogTitle) title = ogTitle[1] || ogTitle[2];

  // twitter:title
  if (!title) {
    const twTitle = html.match(/<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
    if (twTitle) title = twTitle[1];
  }

  // <title> with cleanup
  if (!title) {
    const tMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (tMatch) {
      title = tMatch[1].trim();
      for (const suffix of SITE_SUFFIXES) {
        if (title.endsWith(suffix)) { title = title.slice(0, -suffix.length).trim(); break; }
      }
      // Strip common site name prefixes
      title = title.replace(/^(?:Ravelry|Instagram|Pinterest|Etsy|YouTube|Twitter):\s*/i, "");
    }
  }

  // <h1>
  if (!title) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) title = h1[1].replace(/<[^>]+>/g, "").trim();
  }

  // URL path fallback
  if (!title) {
    try {
      const path = decodeURIComponent(new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "");
      if (path && path.length > 3 && !path.includes(".")) title = path;
    } catch {}
  }

  return { title, images: images.slice(0, 5) };
}

function parseHtmlForData(html: string, url: string): { title: string; images: string[]; platform: string } {
  const platform = detectPlatform(url);

  if (platform === "小红书") {
    const xhs = extractXHSData(html, url);
    if (xhs && (xhs.title || xhs.images.length > 0)) {
      return { ...xhs, platform };
    }
  }

  const generic = extractGenericData(html, url);
  return { ...generic, platform };
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

export async function scrapeUrl(url: string, signal?: AbortSignal): Promise<{ title: string; images: string[]; platform: string }> {
  const platform = detectPlatform(url);
  const proxyUrls = CORS_PROXIES.map(fn => fn(url));

  const results = await Promise.allSettled(
    proxyUrls.map(proxyUrl => fetchViaProxy(proxyUrl, signal))
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value && result.value.length > 100) {
      const data = parseHtmlForData(result.value, url);
      if (data.title || data.images.length > 0) return data;
    }
  }

  return { title: "", images: [], platform };
}