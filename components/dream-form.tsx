"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dreamInputSchema, DreamInput } from "@/lib/schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface DreamFormProps {
  onSubmit: (data: DreamInput) => void;
  isSubmitting: boolean;
}

export function DreamForm({ onSubmit, isSubmitting }: DreamFormProps) {
  const {
    register,
    handleSubmit,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">核心夢境紀錄</h2>
          <p className="text-sm text-slate-500">請盡可能詳細地描述您昨晚的夢境內容。</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">夢境標題</label>
            <Input {...register("title")} placeholder="為您的夢境取個名字" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">記錄日期</label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">夢境內容</label>
          <Textarea 
            {...register("dreamContent")} 
            placeholder="發生了什麼事？有哪些場景轉換？" 
            className="min-h-[120px]"
          />
          {errors.dreamContent && <p className="text-xs text-red-500">{errors.dreamContent.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">醒來後的情緒</label>
            <Input {...register("wakingEmotion")} placeholder="例如：害怕、困惑、平靜" />
            {errors.wakingEmotion && <p className="text-xs text-red-500">{errors.wakingEmotion.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">夢中的主要情緒</label>
            <Input {...register("dreamEmotion")} placeholder="例如：焦慮、快樂、憤怒" />
            {errors.dreamEmotion && <p className="text-xs text-red-500">{errors.dreamEmotion.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">象徵與聯想</h2>
          <p className="text-sm text-slate-500">拆解夢境元素，並記錄您個人的第一直覺聯想。</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">關鍵人物 (選填)</label>
            <Input {...register("keyCharacters")} placeholder="出現了誰？" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">關鍵場景 (選填)</label>
            <Input {...register("keyScenes")} placeholder="在什麼地方？" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">特殊符號/物件 (選填)</label>
            <Input {...register("keySymbols")} placeholder="引人注意的物品？" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">個人聯想</label>
          <Textarea 
            {...register("personalAssociations")} 
            placeholder="這些人物、場景或物品，讓您聯想到現實生活中的什麼？這對解析非常重要。" 
            className="min-h-[80px]"
          />
          {errors.personalAssociations && <p className="text-xs text-red-500">{errors.personalAssociations.message}</p>}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
         <div>
          <h2 className="text-lg font-bold text-slate-900">現實連結</h2>
          <p className="text-sm text-slate-500">協助系統將夢境與您當前的生活狀態建立連結。</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">近期生活事件/壓力源 (選填)</label>
          <Textarea 
            {...register("recentLifeEvents")} 
            placeholder="最近發生了什麼重大事件，或是讓您感到壓力的事情？" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">其他備註 (選填)</label>
          <Input {...register("additionalNotes")} placeholder="任何想補充的細節" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto">
          {isSubmitting ? "正在解析夢境..." : "開始深度解析"}
        </Button>
      </div>
    </form>
  );
}
