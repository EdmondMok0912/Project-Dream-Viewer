"use client";

import { useState, useEffect } from "react";
import { DreamForm } from "@/components/dream-form";
import { ReportView } from "@/components/report-view";
import { CrisisStop } from "@/components/crisis-stop";
import { DreamInput, AnalysisReport } from "@/lib/schemas";
import Link from "next/link";

type AppState = "FORM" | "LOADING" | "REPORT" | "CRISIS";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("FORM");
  const [inputData, setInputData] = useState<DreamInput | null>(null);
  const [reportData, setReportData] = useState<AnalysisReport | null>(null);
  const [customApiKey, setCustomApiKey] = useState("");

  useEffect(() => {
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
         alert("分析過程中發生錯誤，請稍後再試。");
         setAppState("FORM");
      }
    } catch (e) {
      console.error(e);
      alert("連線失敗，請檢查網路狀態。");
      setAppState("FORM");
    }
  };

  const handleReset = () => {
    setAppState("FORM");
    setInputData(null);
    setReportData(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 selection:bg-slate-200 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <span className="font-semibold tracking-tight text-slate-900 text-lg">Dream Reflection</span>
          </div>
          <nav className="text-sm font-medium flex items-center gap-4">
             <Link href="/archive" className="text-slate-500 hover:text-slate-900 transition-colors">
               檔案櫃 (比較)
             </Link>
             <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-md hidden sm:inline-block">
               非臨床教育工具
             </span>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        
        {appState === "FORM" && (
          <div className="space-y-8 animate-in fade-in fill-mode-both duration-500">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">夢境紀錄與結構化反思</h1>
              <p className="text-base text-slate-500 leading-relaxed mb-6">
                本系統為心理教育工具，採用榮格取向輔以多重視角為您搭建反思框架。我們不提供醫療診斷或心理治療。請填寫下方表單以開始。
              </p>

              <div className="bg-slate-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 border border-slate-200 mb-8">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">自訂 Gemini API Key (選填):</span>
                <input 
                  type="password" 
                  value={customApiKey} 
                  onChange={handleApiKeyChange} 
                  className="flex-1 bg-white border border-slate-300 outline-none rounded-md px-3 py-1.5 text-sm focus:border-blue-500 transition-colors" 
                  placeholder="如果系統 API 由於流量用盡，可在此輸入您個人的 API Key" 
                />
              </div>
            </div>
            <DreamForm onSubmit={handleSubmit} isSubmitting={false} />
          </div>
        )}

        {appState === "LOADING" && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in fill-mode-both duration-500">
            <div className="h-8 w-8 rounded-full border-2 border-slate-900 border-r-transparent animate-spin"></div>
            <p className="text-slate-500 font-medium">系統正在分析與建立框架，請稍候...</p>
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
