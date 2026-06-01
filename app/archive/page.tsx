"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExportedDream } from "@/lib/schemas";
import { UploadCloud, Activity, Trash2, ArrowLeft } from "lucide-react";

export default function ArchivePage() {
  const [dreams, setDreams] = useState<ExportedDream[]>([]);
  const [compareReport, setCompareReport] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomApiKey(localStorage.getItem("custom_gemini_key") || "");
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomApiKey(val);
    localStorage.setItem("custom_gemini_key", val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          // Assuming basic validation
          if (json.version && json.input && json.report) {
             setDreams(prev => {
                // Avoid duplicates by timestamp or title
                if (prev.some(d => d.timestamp === json.timestamp)) return prev;
                return [...prev, json].sort((a, b) => new Date(b.input.date).getTime() - new Date(a.input.date).getTime());
             });
          }
        } catch (error) {
          console.error("Invalid file format");
          alert("檔案格式不符，請選擇透過系統下載的夢境 JSON 檔案。");
        }
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
    try {
      const payload = dreams.map(d => ({
         date: d.input.date,
         title: d.input.title,
         wakingEmotion: d.input.wakingEmotion,
         dreamEmotion: d.input.dreamEmotion,
         theme: d.report.summary.theme,
         mainSymbols: d.report.summary.mainSymbols
      }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) {
        headers["x-custom-api-key"] = customApiKey;
      }

      const res = await fetch("/api/compare", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.type === "SUCCESS") {
         setCompareReport(result.report);
      } else {
         alert("比較失敗，請稍後再試。");
      }
    } catch (error) {
      alert("網路連線失敗。");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 selection:bg-slate-200 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center p-1 rounded-sm hover:bg-slate-100">
               <ArrowLeft className="h-5 w-5" />
             </Link>
             <span className="font-semibold tracking-tight text-slate-900 text-lg">檔案櫃與比較 (暫存區)</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-in fade-in fill-mode-both duration-500">
         
         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
            <input 
              type="file" 
              multiple 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <div className="h-12 w-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
               <UploadCloud className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">匯入夢境紀錄</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              為了保護您的隱私，本系統不提供雲端儲存。您可以手動匯入先前下載的夢境 JSON 檔案，以在此暫存區瀏覽或進行歷次記錄比較。重新整理頁面後，資料即會清除。
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              選擇 JSON 檔案
            </Button>

            <div className="bg-slate-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 border border-slate-200 mt-6 max-w-md mx-auto text-left">
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

         {dreams.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-bold text-slate-900">目前匯入的紀錄 ({dreams.length})</h3>
                   <Button 
                      variant="secondary" 
                      onClick={runComparison}
                      disabled={dreams.length < 2 || isComparing}
                   >
                     {isComparing ? (
                         <>
                            <div className="h-4 w-4 mr-2 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></div>
                            分析中...
                         </>
                     ) : (
                         <><Activity className="h-4 w-4 mr-2" /> 執行趨勢比較</>
                     )}
                   </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {dreams.map(dream => (
                      <div key={dream.timestamp} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                         <button 
                           onClick={() => removeDream(dream.timestamp)}
                           className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                         <h4 className="font-medium text-slate-900 pr-6 truncate">{dream.input.title}</h4>
                         <p className="text-xs text-slate-500 mb-3">{dream.input.date}</p>
                         <div className="text-sm text-slate-600 line-clamp-2">
                             {dream.input.dreamContent}
                         </div>
                      </div>
                   ))}
                </div>
            </div>
         )}
         
         {dreams.length > 0 && dreams.length < 2 && (
             <p className="text-sm text-slate-500 text-center py-4">
                 請匯入至少 2 筆以上的夢境紀錄以啟用比較功能。
             </p>
         )}

         {compareReport && (
            <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">歷次分析比較報告</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">重複象徵</h4>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                          {compareReport.recurringSymbols.map((item: string, i: number) => <li key={i}>{item}</li>)}
                          {compareReport.recurringSymbols.length === 0 && <li>無明顯重複象徵</li>}
                      </ul>
                   </div>
                   <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">共同情緒</h4>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                          {compareReport.recurringEmotions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                          {compareReport.recurringEmotions.length === 0 && <li>無明顯情感一致性</li>}
                      </ul>
                   </div>
                   <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">反覆出現的主題</h4>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                          {compareReport.commonThemes.map((item: string, i: number) => <li key={i}>{item}</li>)}
                          {compareReport.commonThemes.length === 0 && <li>無明顯雷同主題</li>}
                      </ul>
                   </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-3">
                   <h4 className="text-lg font-bold text-slate-900">時序發展與趨勢 (Timeline Analysis)</h4>
                   <p className="text-base text-slate-700 leading-relaxed">
                       {compareReport.timelineAnalysis}
                   </p>
                </div>
            </div>
         )}
      </div>
    </main>
  );
}
