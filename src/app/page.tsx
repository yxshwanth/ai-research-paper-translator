"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileUpload } from "@/components/FileUpload";
import { ResultsView } from "@/components/ResultsView";
import { Upload, Brain, BookOpen } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1a2332] mb-4">
            🧠 AI Research Paper Translator
          </h1>
          <p className="text-lg text-[#1a2332]/80 max-w-2xl mx-auto">
            Upload any research paper and get an instant, student-friendly
            breakdown — summary, key concepts, ELI12, and a quiz to test your
            understanding.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16"
        >
          <FileUpload onResult={setResult} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="font-heading text-xl text-[#1a2332] mb-6 text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-[#e8e4dc] shadow-sm">
              <div className="rounded-full bg-[#1a2332]/10 p-4 mb-3">
                <Upload className="h-8 w-8 text-[#1a2332]" />
              </div>
              <h3 className="font-heading font-semibold text-[#1a2332] mb-2">
                Upload PDF
              </h3>
              <p className="text-sm text-[#1a2332]/70">
                Drag and drop your research paper or click to browse
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-[#e8e4dc] shadow-sm">
              <div className="rounded-full bg-[#1a2332]/10 p-4 mb-3">
                <Brain className="h-8 w-8 text-[#1a2332]" />
              </div>
              <h3 className="font-heading font-semibold text-[#1a2332] mb-2">
                AI Analyzes
              </h3>
              <p className="text-sm text-[#1a2332]/70">
                Gemini extracts summary, contributions, and key concepts
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-[#e8e4dc] shadow-sm">
              <div className="rounded-full bg-[#1a2332]/10 p-4 mb-3">
                <BookOpen className="h-8 w-8 text-[#1a2332]" />
              </div>
              <h3 className="font-heading font-semibold text-[#1a2332] mb-2">
                Learn & Quiz
              </h3>
              <p className="text-sm text-[#1a2332]/70">
                Study the breakdown and test yourself with interactive quiz
              </p>
            </div>
          </div>
        </motion.section>

        {result && (
          <motion.section
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-8 border-t border-[#e8e4dc]"
          >
            <ResultsView result={result} />
          </motion.section>
        )}
      </main>
    </div>
  );
}
