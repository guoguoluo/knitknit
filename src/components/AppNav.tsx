"use client";

import Link from "next/link";
import { useTexts } from "@/lib/language";
import DataActions from "@/components/DataActions";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AppNav() {
  const texts = useTexts();

  return (
    <nav className="relative z-40 felt-nav backdrop-blur-lg border-b shrink-0 stitch-border-b">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2 min-h-14">
        <Link href="/" className="font-bold text-base sm:text-lg text-[#2B2B2B] shrink-0 leading-none">{texts.brand}</Link>
        <div className="flex items-center justify-end gap-2 sm:gap-6 text-sm shrink min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch] max-w-full">
          <Link href="/yarns" className="text-[#6B6B6B] hover:text-[#2B2B2B] transition font-medium whitespace-nowrap">{texts.navYarns}</Link>
          <Link href="/inspirations" className="text-[#6B6B6B] hover:text-[#2B2B2B] transition font-medium whitespace-nowrap">{texts.navInspirations}</Link>
          <DataActions />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
