"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dreamInputSchema, DreamInput } from "@/lib/schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useI18n } from "./i18n-provider";

const WordCount = ({ text, suggested }: { text?: string, suggested?: string }) => {
  const { lang } = useI18n();
  const count = text?.trim().length || 0;
  
  if (lang === "en") {
    return (
      <span className="text-xs text-stone-400 font-normal ml-2">
        ({count} characters{suggested && ` / limit < ${suggested}`})
      </span>
    );
  } else {
    return (
      <span className="text-xs text-stone-400 font-normal ml-2">
        ({count} 字{suggested && ` / 建議 < ${suggested} 字`})
      </span>
    );
  }
};

interface DreamFormProps {
  onSubmit: (data: DreamInput) => void;
  isSubmitting: boolean;
}

export function DreamForm({ onSubmit, isSubmitting }: DreamFormProps) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DreamInput>({
    resolver: zodResolver(dreamInputSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      title: "",
      dreamContent: "",
      wakingEmotion: "",
      dreamEmotion: "",
      keyCharacters: "",
      keyScenes: "",
      keySymbols: "",
      personalAssociations: "",
      recentLifeEvents: "",
      additionalNotes: "",
    },
  });

  const DRAFT_KEY = "dream_form_draft";

  const formValues = watch();

  React.useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        reset(parsed);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [reset]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
    }, 500); // debounce save
    return () => clearTimeout(timeoutId);
  }, [formValues]);

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear the draft? / 確定要清空草稿嗎？")) {
      localStorage.removeItem(DRAFT_KEY);
      reset({
        date: new Date().toISOString().split("T")[0],
        title: "",
        dreamContent: "",
        wakingEmotion: "",
        dreamEmotion: "",
        keyCharacters: "",
        keyScenes: "",
        keySymbols: "",
        personalAssociations: "",
        recentLifeEvents: "",
        additionalNotes: "",
      });
    }
  };

  const handleManualSave = () => {
    const values = watch();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    alert(t("form_draft_saved"));
  };

  const emotions = [
    t("emo_joy"),
    t("emo_trust"),
    t("emo_fear"),
    t("emo_surprise"),
    t("emo_sadness"),
    t("emo_disgust"),
    t("emo_anger"),
    t("emo_anticipation")
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900">{t("form_core_title")}</h2>
          <p className="text-sm text-stone-500">{t("form_core_desc")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">{t("form_title_label")}</label>
            <Input {...register("title")} placeholder={t("form_title_placeholder")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">{t("form_date_label")}</label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t("form_content_label")}
              <WordCount text={formValues.dreamContent} suggested="500" />
            </label>
          <Textarea 
            {...register("dreamContent")} 
            placeholder={t("form_content_placeholder")} 
            className="min-h-[120px]"
          />
          {errors.dreamContent && <p className="text-xs text-red-500">{errors.dreamContent.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t("form_wake_emotion_label")}
              <WordCount text={formValues.wakingEmotion} suggested="30" />
            </label>
            <Input {...register("wakingEmotion")} placeholder={t("form_wake_emotion_placeholder")} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {emotions.map(emo => (
                <button 
                  key={`wake-${emo}`} type="button" 
                  onClick={() => {
                     const current = formValues.wakingEmotion || "";
                     const valToAdd = emo.split(" ")[0]; // Just take the short word if it has English part
                     setValue("wakingEmotion", current ? `${current}, ${valToAdd}` : valToAdd, { shouldValidate: true, shouldDirty: true });
                  }}
                  className="text-[11px] px-2.5 py-1 bg-stone-100/80 text-stone-600 rounded-full hover:bg-stone-200 transition-colors border border-stone-200/60"
                >
                  {emo}
                </button>
              ))}
            </div>
            {errors.wakingEmotion && <p className="text-xs text-red-500">{errors.wakingEmotion.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t("form_dream_emotion_label")}
              <WordCount text={formValues.dreamEmotion} suggested="30" />
            </label>
            <Input {...register("dreamEmotion")} placeholder={t("form_dream_emotion_placeholder")} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {emotions.map(emo => (
                <button 
                  key={`dream-${emo}`} type="button" 
                  onClick={() => {
                     const current = formValues.dreamEmotion || "";
                     const valToAdd = emo.split(" ")[0];
                     setValue("dreamEmotion", current ? `${current}, ${valToAdd}` : valToAdd, { shouldValidate: true, shouldDirty: true });
                  }}
                  className="text-[11px] px-2.5 py-1 bg-stone-100/80 text-stone-600 rounded-full hover:bg-stone-200 transition-colors border border-stone-200/60"
                >
                  {emo}
                </button>
              ))}
            </div>
            {errors.dreamEmotion && <p className="text-xs text-red-500">{errors.dreamEmotion.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900">{t("form_symbols_title")}</h2>
          <p className="text-sm text-stone-500">{t("form_symbols_desc")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t("form_person_label")}
              <WordCount text={formValues.keyCharacters} suggested="30" />
            </label>
            <Input {...register("keyCharacters")} placeholder={t("form_person_placeholder")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t("form_scene_label")}
              <WordCount text={formValues.keyScenes} suggested="30" />
            </label>
            <Input {...register("keyScenes")} placeholder={t("form_scene_placeholder")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              {t("form_object_label")}
              <WordCount text={formValues.keySymbols} suggested="30" />
            </label>
            <Input {...register("keySymbols")} placeholder={t("form_object_placeholder")} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">
            {t("form_association_label")}
            <WordCount text={formValues.personalAssociations} suggested="200" />
          </label>
          <Textarea 
            {...register("personalAssociations")} 
            placeholder={t("form_association_placeholder")} 
            className="min-h-[80px]"
          />
          {errors.personalAssociations && <p className="text-xs text-red-500">{errors.personalAssociations.message}</p>}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
         <div>
          <h2 className="text-lg font-bold text-stone-900">{t("form_reality_title")}</h2>
          <p className="text-sm text-stone-500">{t("form_reality_desc")}</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">
            {t("form_stress_label")}
            <WordCount text={formValues.recentLifeEvents} suggested="200" />
          </label>
          <Textarea 
            {...register("recentLifeEvents")} 
            placeholder={t("form_stress_placeholder")} 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">
            {t("form_note_label")}
            <WordCount text={formValues.additionalNotes} suggested="100" />
          </label>
          <Input {...register("additionalNotes")} placeholder={t("form_note_placeholder")} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleManualSave}
            className="flex-1 sm:flex-none text-stone-600"
          >
            {t("form_draft_save")}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleClearDraft}
            className="text-stone-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            {t("form_draft_clear")}
          </Button>
        </div>
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
          {isSubmitting ? t("form_submitting") : t("form_submit")}
        </Button>
      </div>
    </form>
  );
}
