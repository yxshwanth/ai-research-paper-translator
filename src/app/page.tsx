"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileUpload } from "@/components/FileUpload";
import { ResultsView } from "@/components/ResultsView";
import { Upload, Brain, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <main className="container mx-auto px-4 py-12 md:px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-6 flex justify-center"
          >
            <div className="rounded-full bg-gradient-to-br from-accent/20 to-accent/5 p-6">
              <Brain className="h-16 w-16 text-accent" />
            </div>
          </motion.div>

          <h1
            className="mb-4 text-5xl md:text-6xl lg:text-7xl text-foreground font-heading"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            AI Research Paper Translator
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-muted-foreground mb-8">
            Upload any research paper and get an instant, student-friendly
            breakdown with summaries, key concepts, and interactive quizzes.
          </p>
        </motion.div>

        {/* Upload Section */}
        {!result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <FileUpload onResult={setResult} />
          </motion.div>
        )}

        {/* How It Works Section - only when no results */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-20"
          >
            <h2
              className="mb-12 text-center text-3xl text-foreground font-heading"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              How It Works
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              <motion.div
                whileHover={{ y: -5 }}
                className="rounded-2xl border border-border bg-card p-8 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-accent/10 p-4">
                    <Upload className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl text-foreground font-heading" style={{ fontFamily: "var(--font-heading)" }}>
                  1. Upload PDF
                </h3>
                <p className="text-muted-foreground">
                  Simply drag and drop your research paper or click to browse. We accept PDFs up to 10 MB.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="rounded-2xl border border-border bg-card p-8 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-accent/10 p-4">
                    <Brain className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl text-foreground font-heading" style={{ fontFamily: "var(--font-heading)" }}>
                  2. AI Analyzes
                </h3>
                <p className="text-muted-foreground">
                  Our AI reads and breaks down complex academic language into simple, digestible explanations.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="rounded-2xl border border-border bg-card p-8 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-accent/10 p-4">
                    <Sparkles className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl text-foreground font-heading" style={{ fontFamily: "var(--font-heading)" }}>
                  3. Learn & Quiz
                </h3>
                <p className="text-muted-foreground">
                  Get summaries, key insights, concept explanations, and test your understanding with interactive quizzes.
                </p>
              </motion.div>
            </div>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-16 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-8"
            >
              <h3 className="mb-6 text-center text-2xl text-foreground font-heading" style={{ fontFamily: "var(--font-heading)" }}>
                Why Students Love PaperTranslator
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                      <span className="text-xs text-accent">✓</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-foreground">Plain Language Summaries</h4>
                    <p className="text-sm text-muted-foreground">Complex papers translated into clear, jargon-free explanations</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                      <span className="text-xs text-accent">✓</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-foreground">Interactive Quizzes</h4>
                    <p className="text-sm text-muted-foreground">Test your comprehension with auto-generated questions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                      <span className="text-xs text-accent">✓</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-foreground">Concept Breakdown</h4>
                    <p className="text-sm text-muted-foreground">Technical terms explained in everyday language</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                      <span className="text-xs text-accent">✓</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-foreground">ELI12 Explanations</h4>
                    <p className="text-sm text-muted-foreground">Complex ideas broken down using fun analogies</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Results Section */}
        {result && (
          <div ref={resultsRef} className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ResultsView result={result} />
            </motion.div>

            {/* Upload Another Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setResult(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-xl border-2 border-accent bg-transparent px-8 py-3 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Analyze Another Paper
              </motion.button>
            </motion.div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>Built for university students to make research papers accessible and engaging.</p>
      </footer>
    </div>
  );
}
