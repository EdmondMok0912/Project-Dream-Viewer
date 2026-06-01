"use client";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "./i18n-provider";
import { X } from "lucide-react";

export function TutorialModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 p-6 w-full max-w-lg z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-stone-900 mb-4">{t("tutorial_title")}</h2>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              {t("tutorial_p1")}
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-stone-900">{t("tutorial_step1_title")}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed mt-1">{t("tutorial_step1_desc")}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-stone-900">{t("tutorial_step2_title")}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed mt-1">{t("tutorial_step2_desc")}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-stone-900">{t("tutorial_step3_title")}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed mt-1">{t("tutorial_step3_desc")}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 text-right">
              <button
                onClick={onClose}
                className="bg-stone-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
                title={t("close")}
              >
                {t("close")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
