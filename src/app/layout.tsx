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
      <body className="bg-gradient-to-br from-purple-50 via-white to-pink-50 h-screen flex flex-col overflow-hidden">
        <nav className="bg-white/70 backdrop-blur-lg border-b border-purple-100 shrink-0 z-40 h-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <Link href="/" className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{texts.brand}</Link>
            <div className="flex items-center gap-2 sm:gap-6 text-sm">
              <Link href="/yarns" className="text-gray-600 hover:text-purple-600 transition font-medium">{texts.navYarns}</Link>
              <Link href="/inspirations" className="text-gray-600 hover:text-purple-600 transition font-medium">{texts.navInspirations}</Link>
              <DataActions />
            </div>
          </div>
        </nav>
        <main className="flex-1 min-h-0">{children}</main>
        <script dangerouslySetInnerHTML={{
          __html: `(async()=>{try{const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.unregister();await navigator.serviceWorker.register('${basePath}/sw.js')}catch(e){console.warn('SW注册失败',e)}})()`
        }} />
      </body>
    </html>
  );
}