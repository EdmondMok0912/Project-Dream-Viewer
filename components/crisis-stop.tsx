import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

export function CrisisStop({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-lg mx-auto bg-white rounded-xl border border-red-200 shadow-sm animate-in fade-in fill-mode-both duration-500">
      <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-stone-900">暫停分析</h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          系統偵測到您的輸入包含高度風險、強烈痛苦或危機暗示。作為一個自動化的心理教育工具，我們無法即時為您提供支持，也不適合在此時進行常規的夢境詮釋。
        </p>
      </div>
      
      <div className="w-full bg-stone-50 p-6 rounded-lg space-y-4 text-left border border-stone-200">
        <h3 className="font-bold text-stone-900">如果您或他人正處於危機之中，請立即尋求專業協助：</h3>
        <ul className="text-sm text-stone-700 space-y-2">
          <li>• 撥打當地緊急求救電話 (如 119)</li>
          <li>• 聯絡 24 小時安心專線 (衛福部: 1925)</li>
          <li>• 生命線協談專線 (1995)</li>
          <li>• 張老師專線 (1980)</li>
        </ul>
        <p className="text-xs text-stone-500 mt-4">
          請記得，您不必獨自面對這一切。尋求真實人類的專業幫助是保護自己的最佳方式。
        </p>
      </div>
      
      <Button variant="outline" onClick={onReset} className="w-full mt-4">
        返回首頁
      </Button>
    </div>
  )
}
