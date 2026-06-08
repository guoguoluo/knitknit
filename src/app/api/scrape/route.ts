import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const runtime = "nodejs";

const SITE_SUFFIXES = [
  " - 小红书", " - 抖音", " - 微博", " - 知乎", " - Bilibili",
  " - Instagram", " - Ravelry", " - Pinterest", " - Etsy",
  " - YouTube", " - Twitter", " - Facebook",
  " | 小红书", " | 抖音", " | 微博", " | 知乎", " | Bilibili",
];

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    const html = await res.text();
    const root = parse(html);

    let platform = "";
    try {
      const u = new URL(url);
      const host = u.hostname.replace("www.", "").toLowerCase();
      if (host.includes("xiaohongshu") || host.includes("xhslink") || host.includes("xhscdn")) platform = "小红书";
      else if (host.includes("instagram")) platform = "Instagram";
      else if (host.includes("ravelry")) platform = "Ravelry";
      else if (host.includes("pinterest")) platform = "Pinterest";
      else if (host.includes("etsy")) platform = "Etsy";
      else if (host.includes("bilibili") || host.includes("b23")) platform = "B站";
    } catch {}

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

    // ---- Image extraction ----

    // 1. og:image
    for (const meta of root.querySelectorAll('meta[property="og:image"], meta[name="og:image"]')) {
      addImage(meta.getAttribute("content") || "");
    }
    if (images.length > 0) return ok(images, root, platform, url);

    // 2. twitter:image
    for (const meta of root.querySelectorAll('meta[name="twitter:image"]')) {
      addImage(meta.getAttribute("content") || "");
    }
    if (images.length > 0) return ok(images, root, platform, url);

    // 3. Xiaohongshu: parse JSON from script tags
    if (platform === "小红书") {
      for (const script of root.querySelectorAll("script")) {
        const text = script.textContent || "";

        // window.__INITIAL_STATE__ or __NEXT_DATA__
        const stateMatch = text.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/);
        if (stateMatch) {
          try {
            const state = JSON.parse(stateMatch[1]);
            const note = state?.note?.noteDetail?.note;
            if (note?.imageList) {
              for (const img of note.imageList) {
                addImage(img.urlDefault || img.url || img.infoList?.[0]?.url);
              }
            }
            if (note?.title && !images.find(() => true)) {
              // we'll use it for title later
            }
          } catch {}
        }

        // XHS JSON-LD with note data
        const urls = text.match(/https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s]+/gi);
        if (urls) for (const u of urls) addImage(u + (!u.includes("!") ? "!nd_dft_wlteh_jpg_3" : ""));
      }

      // ci.xhscdn.com URLs
      const ciUrls = html.match(/https?:\/\/ci\.xhscdn\.com\/[^"'\s]+(?:jpe?g|png|webp)[^"'\s]*/gi);
      if (ciUrls) for (const u of ciUrls) addImage(u);

      if (images.length > 0) return ok(images, root, platform, url);
    }

    // 4. JSON-LD
    for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const d = JSON.parse(script.textContent || "{}");
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
    if (images.length > 0) return ok(images, root, platform, url);

    // 5. First large <img> tag
    for (const img of root.querySelectorAll("img[src]")) {
      const src = img.getAttribute("src") || "";
      const w = parseInt(img.getAttribute("width") || "0");
      const h = parseInt(img.getAttribute("height") || "0");
      const alt = (img.getAttribute("alt") || "").toLowerCase();
      if (w < 100 && h < 100) continue;
      if (alt.includes("icon") || alt.includes("logo") || alt.includes("avatar")) continue;
      addImage(src);
      if (images.length >= 3) break;
    }

    // 6. Regex fallback
    if (images.length === 0) {
      const re = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
      let m;
      while ((m = re.exec(html)) !== null) { addImage(m[1]); if (images.length >= 3) break; }
    }

    return ok(images, root, platform, url);
  } catch (err: any) {
    return NextResponse.json({ images: [], title: "", platform: "", error: err.message });
  }
}

function ok(images: string[], root: ReturnType<typeof parse>, platform: string, url: string) {
  // ---- Title extraction ----
  let title = "";

  // Try og:title
  for (const meta of root.querySelectorAll('meta[property="og:title"], meta[name="og:title"]')) {
    title = meta.getAttribute("content") || "";
    if (title && !isSiteName(title, platform)) break;
  }

  // Try twitter:title
  if (!title || isSiteName(title, platform)) {
    for (const meta of root.querySelectorAll('meta[name="twitter:title"]')) {
      title = meta.getAttribute("content") || "";
      if (title && !isSiteName(title, platform)) break;
    }
  }

  // Try <h1>
  if (!title || isSiteName(title, platform)) {
    const h1 = root.querySelector("h1");
    if (h1) {
      title = h1.textContent?.trim() || "";
      if (title.length < 3) title = "";
    }
  }

  // Try <title> with cleanup
  if (!title || isSiteName(title, platform)) {
    const t = root.querySelector("title");
    if (t) {
      title = t.textContent?.trim() || "";
      for (const suffix of SITE_SUFFIXES) {
        if (title.endsWith(suffix)) {
          title = title.slice(0, -suffix.length).trim();
          break;
        }
      }
      if (isSiteName(title, platform)) title = "";
    }
  }

  // Last resort: from URL path
  if (!title) {
    try {
      const u = new URL(url);
      const path = decodeURIComponent(u.pathname.replace(/\/$/, "").split("/").pop() || "");
      if (path && path.length > 3 && !path.includes(".")) title = path;
    } catch {}
  }

  // ---- Platform detection from og:site_name ----
  if (!platform) {
    for (const meta of root.querySelectorAll('meta[property="og:site_name"]')) {
      const name = (meta.getAttribute("content") || "").toLowerCase();
      if (name.includes("xiaohongshu") || name.includes("red")) platform = "小红书";
      else if (name.includes("instagram")) platform = "Instagram";
      else if (name.includes("ravelry")) platform = "Ravelry";
      else if (name.includes("pinterest")) platform = "Pinterest";
    }
  }

  return NextResponse.json({ images: images.slice(0, 5), title: title.trim(), platform });
}

const siteNames = ["小红书", "抖音", "微博", "知乎", "bilibili", "instagram", "ravelry", "pinterest", "etsy", "youtube", "twitter", "facebook", "百度"];

function isSiteName(title: string, platform: string): boolean {
  const t = title.trim().toLowerCase();
  if (platform && t === platform.toLowerCase()) return true;
  if (t.length < 2) return true;
  for (let i = 0; i < siteNames.length; i++) {
    if (t === siteNames[i].toLowerCase()) return true;
  }
  return false;
}
