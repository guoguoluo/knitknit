const PROXY_TIMEOUT = 8000;

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

function parseHtmlForData(html: string, url: string): { title: string; images: string[]; platform: string } {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (src: string) => {
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
    try {
      const resolved = src.startsWith("http") ? src : src.startsWith("//") ? "https:" + src : new URL(src, url).href;
      if (!resolved || seen.has(resolved)) return;
      const lower = resolved.toLowerCase();
      if (lower.includes("avatar") || lower.includes("icon") || lower.includes("logo") || lower.endsWith(".svg")) return;
      seen.add(resolved);
      images.push(resolved);
    } catch {}
  };

  const platform = detectPlatform(url);

  const ogImg = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i);
  if (ogImg) addImage(ogImg[1]);
  const ogImg2 = html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*\/?>/i);
  if (ogImg2) addImage(ogImg2[1]);

  const twImg = html.match(/<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i);
  if (twImg) addImage(twImg[1]);

  if (platform === "小红书") {
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/);
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const note = state?.note?.noteDetail?.note;
        if (note?.imageList) {
          for (const img of note.imageList) {
            addImage(img.urlDefault || img.url || img.infoList?.[0]?.url);
          }
        }
      } catch {}
    }
    const xhsUrls = html.match(/https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s]+/gi);
    if (xhsUrls) for (const u of xhsUrls) addImage(u);
    const ciUrls = html.match(/https?:\/\/ci\.xhscdn\.com\/[^"'\s]+(?:jpe?g|png|webp)[^"'\s]*/gi);
    if (ciUrls) for (const u of ciUrls) addImage(u);
  }

  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const d = JSON.parse(ldMatch[1]);
      const extract = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (obj.image) {
          if (typeof obj.image === "string") addImage(obj.image);
          else if (Array.isArray(obj.image)) obj.image.forEach((i: any) => typeof i === "string" && addImage(i));
        }
        for (const v of Object.values(obj)) extract(v);
      };
      extract(d);
    } catch {}
  }

  if (images.length === 0) {
    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = imgRe.exec(html)) !== null) {
      const src = m[1];
      const alt = (html.slice(Math.max(0, m.index - 200), m.index + 200).match(/alt=["']([^"']*)["']/i) || ["", ""])[1].toLowerCase();
      if (alt.includes("icon") || alt.includes("logo") || alt.includes("avatar")) continue;
      addImage(src);
      if (images.length >= 3) break;
    }
  }

  let title = "";

  const ogTitle = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i);
  if (ogTitle) title = ogTitle[1];
  const ogTitle2 = html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*\/?>/i);
  if (!title && ogTitle2) title = ogTitle2[1];

  if (!title) {
    const twTitle = html.match(/<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i);
    if (twTitle) title = twTitle[1];
  }

  if (!title) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) title = h1[1].replace(/<[^>]+>/g, "").trim();
  }

  if (!title) {
    const tMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (tMatch) {
      title = tMatch[1].trim();
      for (const suffix of SITE_SUFFIXES) {
        if (title.endsWith(suffix)) {
          title = title.slice(0, -suffix.length).trim();
          break;
        }
      }
    }
  }

  if (!title) {
    try {
      const path = decodeURIComponent(new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "");
      if (path && path.length > 3 && !path.includes(".")) title = path;
    } catch {}
  }

  return { title, images: images.slice(0, 5), platform: platform || "" };
}

async function fetchViaProxy(proxyUrl: string, signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);
  const combinedSignal = signal ?? controller.signal;

  const onParentAbort = signal ? () => controller.abort() : undefined;
  if (onParentAbort) signal!.addEventListener("abort", onParentAbort, { once: true });

  try {
    const res = await fetch(proxyUrl, { signal: combinedSignal, cache: "no-cache" });
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json") || proxyUrl.includes("/get?")) {
      const json = await res.json();
      return typeof json === "string" ? json : json.contents || json.body || "";
    }
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
    if (onParentAbort) signal?.removeEventListener("abort", onParentAbort);
  }
}

export async function scrapeUrl(url: string, signal?: AbortSignal): Promise<{ title: string; images: string[]; platform: string }> {
  const platform = detectPlatform(url);

  for (const proxyFn of CORS_PROXIES) {
    const html = await fetchViaProxy(proxyFn(url), signal);
    if (html && html.length > 100) {
      const result = parseHtmlForData(html, url);
      if (result.title || result.images.length > 0) return result;
    }
  }

  return { title: "", images: [], platform };
}
