"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ExportedDream, CompareReport, compareReportSchema, exportedDreamSchema } from "@/lib/schemas";
import { UploadCloud, Activity, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { useI18n, TranslationKey } from "@/components/i18n-provider";

export default function ArchivePage() {
  const { lang, t } = useI18n();
  const [dreams, setDreams] = useState<ExportedDream[]>([]);
  const [compareReport, setCompareReport] = useState<CompareReport | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [noticeKey, setNoticeKey] = useState<TranslationKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let json: unknown;
        try {
          json = JSON.parse(event.target?.result as string);
        } catch {
          setNoticeKey("archive_invalid_file");
          return;
        }
        const parseResult = exportedDreamSchema.safeParse(json);
        if (!parseResult.success) {
          setNoticeKey("archive_invalid_file");
          return;
        }
        const dream = parseResult.data;
        setNoticeKey(null);
        setDreams(prev => {
          // Avoid duplicates by timestamp
          if (prev.some(d => d.timestamp === dream.timestamp)) return prev;
          return [...prev, dream].sort((a, b) => new Date(b.input.date).getTime() - new Date(a.input.date).getTime());
        });
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeDream = (timestamp: string) => {
    setDreams(prev => prev.filter(d => d.timestamp !== timestamp));
    setCompareReport(null);
  };

  const runComparison = async () => {
    if (dreams.length < 2) return;

    setIsComparing(true);
    setNoticeKey(null);
    try {
      const payload = dreams.map(d => ({
         date: d.input.date,
         title: d.input.title,
         wakingEmotion: d.input.wakingEmotion,
         dreamEmotion: d.input.dreamEmotion,
         theme: d.report.summary.theme,
         mainSymbols: d.report.summary.mainSymbols
      }));

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-app-lang": lang
      };

      const res = await fetch("/api/compare", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 413) {
         setNoticeKey("error_too_large");
         return;
      }

      if (res.status === 504) {
         setNoticeKey("error_timeout_compare");
         return;
      }

      if (res.status === 503) {
         setNoticeKey("error_service_busy");
         return;
      }

      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        throw new Error("Invalid response from server: " + res.status);
      }

      if (res.status === 400 && result.error === "Invalid prompt content detected.") {
         setNoticeKey("error_blocked");
         return;
      }

      if (result.type === "SUCCESS") {
         const reportResult = compareReportSchema.safeParse(result.report);
         if (!reportResult.success) {
            setNoticeKey("error_compare_failed");
            return;
         }
         setCompareReport(reportResult.data);
      } else {
         setNoticeKey("error_compare_failed");
      }
    } catch (error) {
      setNoticeKey("error_network");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-20 selection:bg-stone-200 text-stone-900">
      <div className="bg-white border-b border-stone-200 shadow-sm relative pt-4 pb-2 px-4 mb-10">
        <div className="max-w-5xl mx-auto">
          <Header />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 animate-in fade-in fill-mode-both duration-500">

         {noticeKey && (
            <div role="alert" className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
               {t(noticeKey)}
            </div>
         )}

         <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm text-center">
            <input
              type="file"
              multiple
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <div className="h-12 w-12 bg-stone-50 border border-stone-200 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-500">
               <UploadCloud className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">{t("archive_title")}</h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto mb-6 leading-relaxed">
              {t("archive_desc")}
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              {t("archive_upload_btn")}
            </Button>
         </div>

         {dreams.length > 0 && (
            <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-bold text-stone-900">{t("archive_uploaded_list")} ({dreams.length})</h3>
                   <Button
                      variant="secondary"
                      onClick={runComparison}
                      disabled={dreams.length < 2 || isComparing}
                   >
                     {isComparing ? (
                         <>
                            <div className="h-4 w-4 mr-2 rounded-full border-2 border-stone-900 border-t-transparent animate-spin"></div>
                            {t("archive_comparing")}
                         </>
                     ) : (
                         <><Activity className="h-4 w-4 mr-2" /> {t("archive_compare_btn")}</>
                     )}
                   </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {dreams.map(dream => (
                      <div key={dream.timestamp} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group">
                         <button
                           onClick={() => removeDream(dream.timestamp)}
                           className="absolute top-3 right-3 text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                         <h4 className="font-medium text-stone-900 pr-6 truncate">{dream.input.title}</h4>
                         <p className="text-xs text-stone-500 mb-3">{dream.input.date}</p>
                         <div className="text-sm text-stone-600 line-clamp-2">
                             {dream.input.dreamContent}
                         </div>
                      </div>
                   ))}
                </div>
            </div>
         )}

         {dreams.length > 0 && dreams.length < 2 && (
             <p className="text-sm text-stone-500 text-center py-4 mt-8">
                 {t("archive_import_hint")}
             </p>
         )}

         {compareReport && (
            <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">{t("archive_report_title")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-4 border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                      <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">{t("archive_pattern_title")}</h4>
                      <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                          {compareReport.recurringSymbols.map((item, i) => <li key={i}>{item}</li>)}
                          {compareReport.recurringSymbols.length === 0 && <li>{t("archive_no_symbols")}</li>}
                      </ul>
                   </div>
                   <div className="space-y-4 border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                      <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">{t("archive_trend_title")}</h4>
                      <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                          {compareReport.recurringEmotions.map((item, i) => <li key={i}>{item}</li>)}
                          {compareReport.recurringEmotions.length === 0 && <li>{t("archive_no_emotions")}</li>}
                      </ul>
                   </div>
                   <div className="space-y-4 border border-stone-200 rounded-xl p-5 bg-white shadow-sm">
                      <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">{t("archive_themes_title")}</h4>
                      <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
                          {compareReport.commonThemes.map((item, i) => <li key={i}>{item}</li>)}
                          {compareReport.commonThemes.length === 0 && <li>{t("archive_no_themes")}</li>}
                      </ul>
                   </div>
                </div>

                <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-sm space-y-3">
                   <h4 className="text-lg font-bold text-stone-900">{t("archive_timeline_title")}</h4>
                   <p className="text-base text-stone-700 leading-relaxed">
                       {compareReport.timelineAnalysis}
                   </p>
                </div>
            </div>
         )}
      </div>
    </main>
  );
}
