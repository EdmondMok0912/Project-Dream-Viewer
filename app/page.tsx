"use client";

import { useState, useEffect } from "react";
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
  const [customApiKey, setCustomApiKey] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomApiKey(localStorage.getItem("custom_gemini_key") || "");
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomApiKey(val);
    localStorage.setItem("custom_gemini_key", val);
  };

  const handleSubmit = async (data: DreamInput) => {
    setAppState("LOADING");
    setInputData(data);
    
    try {
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "x-app-lang": lang
      };
      if (customApiKey) {
        headers["x-custom-api-key"] = customApiKey;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();

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
      alert(lang === "en" ? "Connection failed. Please check your network." : "連線失敗，請檢查網路狀態。");
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
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm relative pt-4 pb-2 px-4 shadow-sm mb-10">
        <div className="max-w-5xl mx-auto">
          <Header />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        
        {appState === "FORM" && (
          <div className="space-y-8 animate-in fade-in fill-mode-both duration-500">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">{t("title")}</h1>
              <p className="text-base text-stone-500 leading-relaxed mb-6">
                {t("description")}
              </p>

              <div className="bg-stone-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 border border-stone-200 mb-8">
                <span className="text-sm font-medium text-stone-700 whitespace-nowrap">{t("api_key_label")}</span>
                <input 
                  type="password" 
                  value={customApiKey} 
                  onChange={handleApiKeyChange} 
                  className="flex-1 bg-white border border-stone-300 outline-none rounded-md px-3 py-1.5 text-sm focus:border-orange-500 transition-colors" 
                  placeholder={t("api_key_placeholder")}
                />
              </div>
            </div>
            <DreamForm onSubmit={handleSubmit} isSubmitting={false} />
          </div>
        )}

        {appState === "LOADING" && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in fill-mode-both duration-500">
            <div className="h-8 w-8 rounded-full border-2 border-stone-900 border-r-transparent animate-spin"></div>
            <p className="text-stone-500 font-medium">{t("form_submitting")}</p>
          </div>
        )}

        {appState === "REPORT" && reportData && inputData && (
          <ReportView report={reportData} input={inputData} onReset={handleReset} />
        )}

        {appState === "CRISIS" && (
          <CrisisStop onReset={handleReset} />
        )}

      </div>
    </main>
  );
}
