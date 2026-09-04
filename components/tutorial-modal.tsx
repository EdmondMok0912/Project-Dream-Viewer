"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "./i18n-provider";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function TutorialModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useI18n();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => onCloseRef.current()}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl border border-stone-200 p-6 w-full max-w-lg z-10 focus:outline-none"
          >
            <button
              onClick={() => onCloseRef.current()}
              aria-label={t("close")}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="tutorial-modal-title" className="text-xl font-bold text-stone-900 mb-4">{t("tutorial_title")}</h2>
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
                onClick={() => onCloseRef.current()}
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
