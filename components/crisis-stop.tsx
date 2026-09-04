import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { useI18n } from "./i18n-provider";

export function CrisisStop({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-lg mx-auto bg-white rounded-xl border border-red-200 shadow-sm animate-in fade-in fill-mode-both duration-500">
      <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-stone-900">
          {t("crisis_title")}
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          {t("crisis_desc")}
        </p>
      </div>

      <div className="w-full bg-stone-50 p-6 rounded-lg space-y-4 text-left border border-stone-200">
        <h3 className="font-bold text-stone-900">
          {t("crisis_help")}
        </h3>
        <ul className="text-sm text-stone-700 space-y-2">
          <li>• {t("crisis_hk")}</li>
          <li>• {t("crisis_tw")}</li>
        </ul>
        <p className="text-xs text-stone-500 mt-4">
          {t("crisis_note")}
        </p>
      </div>

      <Button variant="outline" onClick={onReset} className="w-full mt-4">
        {t("crisis_return")}
      </Button>
    </div>
  )
}
