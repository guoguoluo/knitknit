import type { Metadata, Viewport } from "next";
import { texts } from "@/lib/texts";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = {
  title: texts.siteTitle,
  description: texts.siteDescription,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#F8EFDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <html lang={texts.htmlLang}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={texts.appleWebAppTitle} />
        <link rel="apple-touch-icon" sizes="192x192" href={`${basePath}/icons/icon-192x192.png`} />
        <link rel="apple-touch-icon" sizes="512x512" href={`${basePath}/icons/icon-512x512.png`} />
      </head>
      <body className="min-h-[100svh] h-[100svh] flex flex-col">
        <LanguageProvider>
          <AppNav />
          <main className="flex-1 min-h-0 overflow-y-auto relative z-10">{children}</main>
          <script dangerouslySetInnerHTML={{
            __html: `(async()=>{try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));}if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if(!sessionStorage.getItem('knit-sw-cleared')){sessionStorage.setItem('knit-sw-cleared','1');location.reload();}}catch(e){console.warn('SW cleanup failed',e)}})()`,
          }} />
        </LanguageProvider>
      </body>
    </html>
  );
}
