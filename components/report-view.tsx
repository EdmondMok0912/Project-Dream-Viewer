"use client";

import * as React from "react";
import Markdown from "react-markdown";
import { AnalysisReport, DreamInput } from "@/lib/schemas";
import { Button } from "./ui/button";
import { Download, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface ReportViewProps {
  report: AnalysisReport;
  input: DreamInput;
  onReset: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  },
};

export function ReportView({ report, input, onReset }: ReportViewProps) {
  const handleDownloadJSON = () => {
    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      input,
      report,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dream-analysis-${input.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMD = () => {
    const md = `
# 夢境分析報告：${input.title}
**日期：** ${input.date}

## 夢境摘要
- **核心主題：** ${report.summary.theme}
- **核心情緒：** ${report.summary.coreEmotion}
- **主要象徵：** ${report.summary.mainSymbols.join(", ")}

${report.summary.briefSummary}

## 榮格取向深度分析
${report.detailedAnalysis.jungianPerspective}

### 心理動力與補償
${report.detailedAnalysis.psychodynamicCompensation}

### 現實生活連結
${report.detailedAnalysis.realLifeConnection}

### 本週反思
${report.detailedAnalysis.weeklyReflectionQuestions.map((q) => `- ${q}`).join("\n")}

## 其他可能視角附錄
- **佛洛伊德視角：** ${report.alternativePerspectives?.freudianView || "無"}
- **現代心理學視角：** ${report.alternativePerspectives?.modernPsychology || "無"}
- **生理或壓力因素：** ${report.alternativePerspectives?.physiologicalOrStressFactors || "無"}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dream-analysis-${input.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            分析報告：{input.title}
          </h1>
          <p className="text-sm text-stone-500 mt-1">{input.date}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
            <Download className="mr-2 h-4 w-4" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadMD}>
            <Download className="mr-2 h-4 w-4" /> Markdown
          </Button>
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" /> 新解析
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <motion.div variants={itemVariants} className="rounded-xl bg-white p-5 shadow-sm border border-stone-200">
            <h3 className="font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">
              第一層：摘要矩陣
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-stone-500 mb-1">核心主題</span>
                <span className="font-medium text-stone-900">{report.summary.theme}</span>
              </div>
              <div>
                <span className="block text-stone-500 mb-1">核心情緒</span>
                <span className="font-medium text-stone-900">{report.summary.coreEmotion}</span>
              </div>
              <div>
                <span className="block text-stone-500 mb-1">主要象徵</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.summary.mainSymbols.map((s, i) => (
                    <span key={i} className="inline-flex items-center rounded-sm bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <p className="text-stone-700 leading-relaxed">{report.summary.briefSummary}</p>
              </div>
            </div>
          </motion.div>
          
           <motion.div variants={itemVariants} className="rounded-xl bg-white p-5 shadow-sm border border-stone-200">
            <h3 className="font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">
              延伸多重視角
            </h3>
            <div className="space-y-4 text-sm text-stone-700">
               {report.alternativePerspectives?.freudianView && (
                  <div>
                    <span className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">佛洛伊德觀點</span>
                    <p>{report.alternativePerspectives.freudianView}</p>
                  </div>
               )}
               {report.alternativePerspectives?.modernPsychology && (
                  <div>
                    <span className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">現代心理/認知</span>
                    <p>{report.alternativePerspectives.modernPsychology}</p>
                  </div>
               )}
               {report.alternativePerspectives?.physiologicalOrStressFactors && (
                  <div>
                    <span className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">生理與壓力因素</span>
                    <p>{report.alternativePerspectives.physiologicalOrStressFactors}</p>
                  </div>
               )}
            </div>
          </motion.div>
        </div>

        {/* Detailed Analysis Main Body */}
        <div className="md:col-span-2 space-y-8">
          <motion.section variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
              第二層：深層結構解析
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed prose-p:mb-4">
               <Markdown>{report.detailedAnalysis.jungianPerspective}</Markdown>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-3 rounded-xl border border-stone-200 p-6 bg-white shadow-sm">
            <h3 className="text-lg font-bold text-stone-900">心理動力與意識補償</h3>
            <p className="text-stone-700 leading-relaxed text-sm">
              {report.detailedAnalysis.psychodynamicCompensation}
            </p>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-3 rounded-xl border border-stone-200 p-6 bg-white shadow-sm">
            <h3 className="text-lg font-bold text-stone-900">現實生活映射</h3>
            <p className="text-stone-700 leading-relaxed text-sm">
              {report.detailedAnalysis.realLifeConnection}
            </p>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4 bg-stone-900 text-stone-50 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-white">本週反思 (Weekly Reflection)</h3>
            <ul className="space-y-3 text-sm text-stone-300 list-none p-0 m-0">
              {report.detailedAnalysis.weeklyReflectionQuestions.map((q, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="font-mono text-stone-500 mt-0.5 leading-relaxed">0{i + 1}</span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
