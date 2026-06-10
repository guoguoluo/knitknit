import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { texts } from "@/lib/texts";
import "./globals.css";
import DataActions from "@/components/DataActions";

const basePath = "/knitknit";

export const metadata: Metadata = {
  title: texts.siteTitle,
  description: texts.siteDescription,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#a855f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={texts.htmlLang}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={texts.appleWebAppTitle} />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="apple-touch-icon" sizes="192x192" href={`${basePath}/icons/icon-192x192.png`} />
        <link rel="apple-touch-icon" sizes="512x512" href={`${basePath}/icons/icon-512x512.png`} />
      </head>
      <body className="fabric-body h-screen flex flex-col">
        <div className="grain-overlay fixed inset-0 z-0" />
        <nav className="relative z-40 bg-white/90 backdrop-blur-lg border-b shrink-0 h-14 stitch-border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <Link href="/" className="font-bold text-lg text-[#2B2B2B]">{texts.brand}</Link>
            <div className="flex items-center gap-2 sm:gap-6 text-sm">
              <Link href="/yarns" className="text-[#6B6B6B] hover:text-[#2B2B2B] transition font-medium">{texts.navYarns}</Link>
              <Link href="/inspirations" className="text-[#6B6B6B] hover:text-[#2B2B2B] transition font-medium">{texts.navInspirations}</Link>
              <DataActions />
            </div>
          </div>
        </nav>
        <main className="flex-1 min-h-0 overflow-y-auto relative z-10">{children}</main>
        <script dangerouslySetInnerHTML={{
          __html: `(async()=>{try{const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.unregister();await navigator.serviceWorker.register('${basePath}/sw.js')}catch(e){console.warn('SW注册失败',e)}})()`
        }} />
      </body>
    </html>
  );
}