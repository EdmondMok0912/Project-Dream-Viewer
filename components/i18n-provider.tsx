"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "zh" | "en";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    nav_archive: "夢境歸檔與比較",
    nav_home: "夢境記錄",
    title: "夢境紀錄與結構化反思",
    description: "本系統為心理教育工具，採用榮格取向輔以多重視角為您搭建反思框架。我們不提供醫療診斷或心理治療。請填寫下方表單以開始。",
    tutorial_btn: "使用教學",
    tutorial_title: "如何使用 Project Dream Viewer",
    tutorial_p1: "這是一個幫助你記錄與分析夢境的工具，請遵循以下步驟獲得最佳體驗：",
    tutorial_step1_title: "1. 記錄與分析",
    tutorial_step1_desc: "在首頁填寫你的夢境細節。系統將產生一份採用榮格心理學與多重視角的結構化分析報告。",
    tutorial_step2_title: "2. 下載保存 (重要!)",
    tutorial_step2_desc: "分析完成後，請務必點擊「下載 JSON」將報告保存至你的裝置。這讓你保有你的個人資料，並未未來的比較做準備。",
    tutorial_step3_title: "3. 歸檔與比較",
    tutorial_step3_desc: "前往「夢境歸檔與比較」，上傳你之前下載的多份 JSON 檔案。系統將找出其中反覆出現的象徵、潛在情緒趨勢與心理發展脈絡。",
    close: "關閉",
    form_core_title: "核心夢境紀錄",
    form_core_desc: "請盡可能詳細地描述您昨晚的夢境內容。",
    form_title_label: "夢境標題",
    form_title_placeholder: "為這場夢取個簡短的名字",
    form_date_label: "記錄日期",
    form_content_label: "夢境內容",
    form_content_placeholder: "我夢到...",
    form_wake_emotion_label: "醒來後的情緒",
    form_wake_emotion_placeholder: "平靜、困惑、害怕...",
    form_dream_emotion_label: "夢中的主要情緒",
    form_dream_emotion_placeholder: "焦慮、興奮...",
    form_symbols_title: "象徵與聯想",
    form_symbols_desc: "拆解夢境元素，並記錄您個人的第一直覺聯想。",
    form_person_label: "關鍵人物 (選填)",
    form_person_placeholder: "例如：老朋友、陌生老人",
    form_scene_label: "關鍵場景 (選填)",
    form_scene_placeholder: "例如：童年老家、迷宮",
    form_object_label: "特殊符號/物件 (選填)",
    form_object_placeholder: "例如：一把生鏽的鑰匙",
    form_association_label: "個人聯想",
    form_association_placeholder: "這讓你聯想到什麼？",
    form_reality_title: "現實連結",
    form_reality_desc: "協助系統將夢境與您當前的生活狀態建立連結。",
    form_stress_label: "近期生活事件/壓力源 (選填)",
    form_stress_placeholder: "近期換工作、考試...",
    form_note_label: "其他備註 (選填)",
    form_note_placeholder: "任何想補充的細節",
    form_submit: "開始分析",
    form_submitting: "分析中, 請稍候...",
    form_draft_save: "儲存草稿",
    form_draft_saved: "草稿已儲存！",
    form_draft_clear: "清空草稿",
    form_draft_cleared: "草稿已清空",
    emo_joy: "快樂 (Joy)",
    emo_trust: "信任 (Trust)",
    emo_fear: "恐懼 (Fear)",
    emo_surprise: "驚訝 (Surprise)",
    emo_sadness: "悲傷 (Sadness)",
    emo_disgust: "厭惡 (Disgust)",
    emo_anger: "憤怒 (Anger)",
    emo_anticipation: "期待 (Anticipation)",
    report_title: "分析報告：",
    report_download_json: "下載 JSON",
    report_download_md: "下載 Markdown",
    report_new: "新解析",
    report_layer1: "第一層：摘要矩陣",
    report_theme: "核心主題",
    report_core_emotion: "核心情緒",
    report_symbols: "主要象徵",
    report_brief: "一句話總結",
    report_multi: "延伸多重視角",
    report_freud: "佛洛伊德觀點",
    report_cognitive: "現代心理/認知",
    report_stress: "生理與壓力因素",
    report_layer2: "第二層：深層結構解析",
    report_psychodynamic: "心理動力與意識補償",
    report_real_life: "現實生活映射",
    report_reflection: "本週反思 (Weekly Reflection)",
    archive_title: "夢境歸檔與多重比較",
    archive_desc: "上傳您過去下載的夢境解析 JSON 檔案。系統將為您比較多個夢境，找出反覆出現的象徵、潛在情緒趨勢與心理發展脈絡。",
    archive_upload_btn: "選擇 JSON 檔案 (可多選)",
    archive_compare_btn: "比較已選的夢境",
    archive_comparing: "比較與分析中...",
    archive_uploaded_list: "已載入的夢境紀錄",
    archive_report_title: "夢境趨勢與比較分析",
    archive_pattern_title: "反覆出現的象徵與主題 (Recurring Patterns)",
    archive_trend_title: "情緒趨勢與轉變 (Emotional Trends)",
    archive_timeline_title: "時序發展與趨勢 (Timeline Analysis)",
    archive_overall_title: "整體心理狀態總結 (Overall Summary)",
    archive_suggestion_title: "引導與建議 (Recommendations)",
    crisis_title: "暫停分析",
    crisis_desc: "系統偵測到您的輸入內容包含強烈的自殘或危害生命的意圖，因此已暫停自動解析與探索的功能。",
    crisis_help: "如果您或他人正處於危機之中，請立即尋求專業協助：",
    crisis_hk: "香港：撒瑪利亞防止自殺會 (2389-2222) / 生命熱線 (2382-0000)",
    crisis_tw: "台灣：安心專線 (1925) / 生命線協談專線 (1995)",
    crisis_note: "尋求幫助是勇敢的表現，請與專業資源或信任的人聯繫。"
  },
  en: {
    nav_archive: "Archive & Compare",
    nav_home: "Dream Record",
    title: "Dream Record & Structured Reflection",
    description: "This system is a psychoeducational tool offering Jungian and multi-perspective reflection frameworks. We do not provide medical diagnosis or psychotherapy. Fill out the form below to begin.",
    tutorial_btn: "How to Use",
    tutorial_title: "How to use Project Dream Viewer",
    tutorial_p1: "This is a tool to help you record and analyze your dreams. Follow these steps for the best experience:",
    tutorial_step1_title: "1. Record & Analyze",
    tutorial_step1_desc: "Fill in your dream details on the Home page. The system generates a structured report using Jungian psychology and multi-perspective analysis.",
    tutorial_step2_title: "2. Download & Save (Important!)",
    tutorial_step2_desc: "Once the analysis is complete, make sure to click 'Download JSON' to save the report to your device. This keeps your data private and enables future comparisons.",
    tutorial_step3_title: "3. Archive & Compare",
    tutorial_step3_desc: "Go to 'Archive & Compare', and upload your previously saved JSON files. The system will find recurring symbols, emotional trends, and psychological development patterns across multiple dreams.",
    close: "Close",
    form_core_title: "Core Dream Record",
    form_core_desc: "Describe your dream from last night in as much detail as possible.",
    form_title_label: "Dream Title",
    form_title_placeholder: "Give this dream a short name",
    form_date_label: "Date Recorded",
    form_content_label: "Dream Content",
    form_content_placeholder: "I dreamt that...",
    form_wake_emotion_label: "Emotion Upon Waking",
    form_wake_emotion_placeholder: "Calm, confused, scared...",
    form_dream_emotion_label: "Main Emotion in Dream",
    form_dream_emotion_placeholder: "Anxious, excited...",
    form_symbols_title: "Symbols & Associations",
    form_symbols_desc: "Break down dream elements and record your first intuitive associations.",
    form_person_label: "Key Figures (Optional)",
    form_person_placeholder: "e.g., Old friend, mysterious stranger",
    form_scene_label: "Key Scenes (Optional)",
    form_scene_placeholder: "e.g., Childhood home, a maze",
    form_object_label: "Special Symbols / Objects (Optional)",
    form_object_placeholder: "e.g., A rusty key",
    form_association_label: "Personal Association",
    form_association_placeholder: "What does this remind you of?",
    form_reality_title: "Reality Connection",
    form_reality_desc: "Help the system connect the dream to your current life state.",
    form_stress_label: "Recent Life Events / Stressors (Optional)",
    form_stress_placeholder: "Recent job change, exams...",
    form_note_label: "Other Notes (Optional)",
    form_note_placeholder: "Any additional details",
    form_submit: "Analyze Dream",
    form_submitting: "Analyzing, please wait...",
    form_draft_save: "Save Draft",
    form_draft_saved: "Draft saved!",
    form_draft_clear: "Clear Draft",
    form_draft_cleared: "Draft cleared",
    emo_joy: "Joy",
    emo_trust: "Trust",
    emo_fear: "Fear",
    emo_surprise: "Surprise",
    emo_sadness: "Sadness",
    emo_disgust: "Disgust",
    emo_anger: "Anger",
    emo_anticipation: "Anticipation",
    report_title: "Analysis Report:",
    report_download_json: "Download JSON",
    report_download_md: "Download Markdown",
    report_new: "New Analysis",
    report_layer1: "Layer 1: Summary Matrix",
    report_theme: "Core Theme",
    report_core_emotion: "Core Emotion",
    report_symbols: "Main Symbols",
    report_brief: "One-sentence Summary",
    report_multi: "Multi-Perspective View",
    report_freud: "Freudian View",
    report_cognitive: "Modern Psych/Cognitive",
    report_stress: "Physical & Stress Factors",
    report_layer2: "Layer 2: Deep Structure Analysis",
    report_psychodynamic: "Psychodynamic & Conscious Compensation",
    report_real_life: "Real-Life Mapping",
    report_reflection: "Weekly Reflection",
    archive_title: "Dream Archive & Multi-Comparison",
    archive_desc: "Upload the dream analysis JSON files you downloaded in the past. The system will compare multiple dreams to find recurring symbols, emotional trends, and psychological progress.",
    archive_upload_btn: "Select JSON Files (Multiple Allowed)",
    archive_compare_btn: "Compare Selected Dreams",
    archive_comparing: "Comparing & Analyzing...",
    archive_uploaded_list: "Loaded Dream Records",
    archive_report_title: "Dream Trends & Comparative Analysis",
    archive_pattern_title: "Recurring Patterns & Symbols",
    archive_trend_title: "Emotional Trends & Shifts",
    archive_timeline_title: "Timeline Analysis",
    archive_overall_title: "Overall Psychological Summary",
    archive_suggestion_title: "Recommendations",
    crisis_title: "Analysis Paused",
    crisis_desc: "The system detected content with strong intent of self-harm or life endangerment in your input, so automated analysis and exploration features have been paused.",
    crisis_help: "If you or someone else is in crisis, please seek professional help immediately:",
    crisis_hk: "Hong Kong: The Samaritan Befrienders (2389-2222) / Suicide Prevention Services (2382-0000)",
    crisis_tw: "Taiwan: Peace Hotline (1925) / Lifeline Hotline (1995)",
    crisis_note: "Asking for help is a sign of courage. Please connect with professional resources or someone you trust."
  }
};

export const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedLang = localStorage.getItem("dream_app_lang") as Language;
    if (storedLang === "zh" || storedLang === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(storedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("dream_app_lang", newLang);
  };

  const t = (key: string) => {
    // @ts-ignore
    return translations[lang][key] || key;
  };

  if (!mounted) {
    // Initial server render (use zh as fallback)
    return (
      <I18nContext.Provider value={{ lang: "zh", setLang: () => {}, t: (k) => (translations.zh as any)[k] || k }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
