"use client";
import Link from "next/link";
import { useI18n } from "./i18n-provider";
import { useState } from "react";
import { TutorialModal } from "./tutorial-modal";
import { HelpCircle } from "lucide-react";

export function Header() {
  const { lang, setLang, t } = useI18n();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="font-semibold tracking-tight text-stone-900 text-lg">Project Dream Viewer</span>
        </div>
        <nav className="text-sm font-medium flex items-center gap-4">
           <Link href="/" className="text-stone-500 hover:text-stone-900 transition-colors">
             {t("nav_home")}
           </Link>
           <Link href="/archive" className="text-stone-500 hover:text-stone-900 transition-colors">
             {t("nav_archive")}
           </Link>
           <div className="w-px h-4 bg-stone-200 mx-1"></div>
           <button 
             onClick={() => setIsTutorialOpen(true)}
             className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5"
             title={t("tutorial_btn")}
           >
             <HelpCircle className="w-4 h-4" />
             <span className="hidden sm:inline">{t("tutorial_btn")}</span>
           </button>
           <div className="w-px h-4 bg-stone-200 mx-1"></div>
           <div className="flex items-center bg-stone-100 rounded-md p-0.5">
             <button 
               onClick={() => setLang("zh")}
               className={`px-2 py-1 text-xs rounded-sm transition-colors ${lang === "zh" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
             >
               繁
             </button>
             <button 
               onClick={() => setLang("en")}
               className={`px-2 py-1 text-xs rounded-sm transition-colors ${lang === "en" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
             >
               EN
             </button>
           </div>
        </nav>
      </header>
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </>
  );
}
