import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { TextDecoder } from "util";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    const buffer = await res.arrayBuffer();

    // Detect charset from Content-Type header or HTML meta tag
    const contentType = res.headers.get("content-type") || "";
    let encoding = "utf-8";
    const charsetMatch = contentType.match(/charset\s*=\s*([^\s;]+)/i);
    if (charsetMatch) {
      encoding = charsetMatch[1].toLowerCase();
    } else {
      const metaMatch = new TextDecoder("utf-8").decode(buffer.slice(0, 2000)).match(/<meta[^>]+charset\s*=\s*["']?([^"'\s>]+)/i);
      if (metaMatch) encoding = metaMatch[1].toLowerCase();
    }

    const rawHtml = new TextDecoder(encoding).decode(buffer);
    const images: string[] = [];

    // Determine platform from URL (before encoding issues)
    let platform = "";
    try {
      const u = new URL(url);
      const host = u.hostname.replace("www.", "").toLowerCase();
      if (host.includes("xiaohongshu") || host.includes("xhslink")) platform = "小红书";
      else if (host.includes("instagram")) platform = "Instagram";
      else if (host.includes("ravelry")) platform = "Ravelry";
      else if (host.includes("pinterest")) platform = "Pinterest";
      else if (host.includes("etsy")) platform = "Etsy";
    } catch {}

    const isXiaohongshu = platform === "小红书";

    // Try og:image from raw HTML
    const ogRegex = /<meta[^>]+(?:property|name)\s*=\s*["'](?:\w+:)?og:image["'][^>]+content\s*=\s*["']([^"']+)["']/i;
    const ogMatch = rawHtml.match(ogRegex);
    if (ogMatch && ogMatch[1] && !ogMatch[1].startsWith("data:")) {
      const img = resolveUrl(ogMatch[1], url);
      if (!img.includes("avatar") && !img.includes("icon")) images.push(img);
    }

    // Try twitter:image
    if (images.length === 0) {
      const twitterRegex = /<meta[^>]+name\s*=\s*["']twitter:image["'][^>]+content\s*=\s*["']([^"']+)["']/i;
      const twitterMatch = rawHtml.match(twitterRegex);
      if (twitterMatch && twitterMatch[1] && !twitterMatch[1].startsWith("data:")) {
        images.push(resolveUrl(twitterMatch[1], url));
      }
    }

    // For Xiaohongshu: extract first real image from script JSON or meta
    if (isXiaohongshu && images.length === 0) {
      const noteIdMatch = url.match(/\/item\/([a-f0-9]+)/i);
      if (noteIdMatch) {
        const noteId = noteIdMatch[1];
        // Common XHS CDN patterns
        const cdnCandidates = [
          `https://sns-img-qc.xhscdn.com/${noteId}`,
        ];
        // Try to find actual image URLs from JSON in script tags
        const imgUrls = rawHtml.match(/https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s]+(?:jpe?g|png|webp)[^"'\s]*/gi);
        if (imgUrls) {
          for (const imgUrl of imgUrls) {
            if (!images.includes(imgUrl)) images.push(imgUrl);
            if (images.length >= 3) break;
          }
        }
        // Also try xhscdn format
        const xhscdnUrls = rawHtml.match(/https?:\/\/ci\.xhscdn\.com\/[^"'\s]+(?:jpe?g|png|webp)[^"'\s]*/gi);
        if (xhscdnUrls) {
          for (const imgUrl of xhscdnUrls) {
            if (!images.includes(imgUrl)) images.push(imgUrl);
            if (images.length >= 3) break;
          }
        }
        if (images.length === 0) {
          images.push(cdnCandidates[0]);
        }
      }
    }

    // Fallback: script contents
    if (images.length === 0) {
      const scriptContents = rawHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptContents) {
        for (const script of scriptContents) {
          const urlMatches = script.match(/https?:\/\/[^"'\s]+\.(?:jpe?g|png|webp)[^"'\s]*/gi);
          if (urlMatches) {
            for (const m of urlMatches) {
              if (!m.includes("avatar") && !m.includes("icon") && !images.includes(m) && !m.startsWith("data:")) {
                images.push(m);
                if (images.length >= 3) break;
              }
            }
          }
        }
      }
    }

    // Fallback: <img> tags
    if (images.length === 0) {
      const imgs = rawHtml.match(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi);
      if (imgs) {
        for (const img of imgs) {
          const srcMatch = img.match(/src\s*=\s*["']([^"']+)["']/i);
          if (srcMatch) {
            const src = srcMatch[1];
            if (!src.startsWith("data:") && !src.includes("icon") && !src.includes("logo") && !src.includes("avatar") && !src.endsWith(".svg")) {
              images.push(resolveUrl(src, url));
              if (images.length >= 3) break;
            }
          }
        }
      }
    }

    const titleMatch = rawHtml.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : "";

    return NextResponse.json({ images, title, platform });
  } catch (err: any) {
    return NextResponse.json({ images: [], title: "", platform: "", error: err.message });
  }
}

function resolveUrl(src: string, base: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;
  try { return new URL(src, base).href; } catch { return src; }
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}