"use client";

import { useState } from "react";
import { DreamForm } from "@/components/dream-form";
import { ReportView } from "@/components/report-view";
import { CrisisStop } from "@/components/crisis-stop";
import { DreamInput, AnalysisReport } from "@/lib/schemas";
import { Header } from "@/components/header";
import { useI18n } from "@/components/i18n-provider";

type AppState = "FORM" | "LOADING" | "REPORT" | "CRISIS";

export default function Home() {
  const { lang, t } = useI18n();
  const [appState, setAppState] = useState<AppState>("FORM");
  const [inputData, setInputData] = useState<DreamInput | null>(null);
  const [reportData, setReportData] = useState<AnalysisReport | null>(null);

  const handleSubmit = async (data: DreamInput) => {
    setAppState("LOADING");
    setInputData(data);
    
    try {
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "x-app-lang": lang
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (response.status === 413) {
         alert(lang === "en" ? "Input too large. Please shorten your dream content." : "輸入字數過多，伺服器無法處理，請縮減內容標籤或細節。");
         setAppState("FORM");
         return;
      }

      if (response.status === 504) {
         alert(lang === "en" ? "Server timeout (504). The analysis took too long. Please try shortening your content, or try again later." : "伺服器超時 (504)，分析花費了太長時間。由於伺服器有處理時間限制，請嘗試精簡您的夢境內容與細節後再試一次。");
         setAppState("FORM");
         return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server: " + response.status);
      }

      if (response.status === 400 && result.error === "Invalid prompt content detected.") {
         alert(lang === "en" ? "Invalid characters or restricted keywords detected." : "檢測到無效字元或嘗試繞過系統的指令，拒絕請求。");
         setAppState("FORM");
         return;
      }

      if (response.status === 403 || result.type === "CRISIS_ABORT") {
         setAppState("CRISIS");
         return;
      }

      if (result.type === "SUCCESS" && result.report) {
         setReportData(result.report);
         setAppState("REPORT");
      } else {
         console.error(result);
         alert(lang === "en" ? "An error occurred during analysis. Please try again." : "分析過程中發生錯誤，請稍後再試。");
         setAppState("FORM");
      }
    } catch (e) {
      console.error(e);
      alert(lang === "en" ? "Connection failed. Please check your network or ensure your input is not excessively long." : "連線失敗，請檢查網路狀態，或是您的輸入內容可能超出伺服器可接受的上限。");
      setAppState("FORM");
    }
  };

  const handleReset = () => {
    setAppState("FORM");
    setInputData(null);
    setReportData(null);
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-20 selection:bg-stone-200 text-stone-900">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm relative pt-4 pb-2 px-4 mb-10">
        <div className="max-w-5xl mx-auto">
          <Header />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        
        <div style={{ display: (appState === "FORM" || appState === "LOADING") ? "block" : "none" }}>
          <div className={`space-y-8 animate-in fade-in fill-mode-both duration-500 ${appState === "LOADING" ? "pointer-events-none opacity-60 grayscale-[30%]" : ""}`}>
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">{t("title")}</h1>
              <p className="text-base text-stone-500 leading-relaxed mb-6">
                {t("description")}
              </p>
            </div>
            <DreamForm onSubmit={handleSubmit} isSubmitting={appState === "LOADING"} />
          </div>
        </div>

        {appState === "LOADING" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-stone-200 flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-r-transparent animate-spin"></div>
              <p className="text-stone-700 font-medium">{t("form_submitting")}</p>
            </div>
          </div>
        )}

        {appState === "REPORT" && reportData && inputData && (
          <div className="animate-in fade-in fill-mode-both duration-500">
            <ReportView report={reportData} input={inputData} onReset={handleReset} />
          </div>
        )}

        {appState === "CRISIS" && (
          <CrisisStop onReset={handleReset} />
        )}

      </div>
    </main>
  );
}
