import type { Metadata, Viewport } from "next";
import { texts } from "@/lib/texts";
import "./globals.css";
import DataActions from "@/components/DataActions";

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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
      <body className="bg-gradient-to-br from-purple-50 via-white to-pink-50 min-h-screen overflow-x-hidden">
        <nav className="bg-white/70 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-40 h-14 shrink-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <a href="/" className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{texts.brand}</a>
            <div className="flex items-center gap-2 sm:gap-6 text-sm">
              <a href="/yarns" className="text-gray-600 hover:text-purple-600 transition font-medium">{texts.navYarns}</a>
              <a href="/inspirations" className="text-gray-600 hover:text-purple-600 transition font-medium">{texts.navInspirations}</a>
              <DataActions />
            </div>
          </div>
        </nav>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `(async()=>{try{const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.unregister();await navigator.serviceWorker.register('/sw.js')}catch(e){console.warn('SW注册失败',e)}})()`
        }} />
      </body>
    </html>
  );
}