"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, BookOpen, Star, List, Lightbulb, Brain, Share2, BookMarked, Layers, MessageCircle, FileText, ChevronDown, ChevronUp, AlertTriangle, GitBranch, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { ArgumentSpineView } from "./ArgumentSpineView";
import { SummarySection } from "./SummarySection";
import { KeyContributions } from "./KeyContributions";
import { ConceptsExplainer } from "./ConceptsExplainer";
import { ELI12Section } from "./ELI12Section";
import { QuizSection } from "./QuizSection";
import { CitationsSection } from "./CitationsSection";
import { FlashcardsView } from "./FlashcardsView";
import { AskSection } from "./AskSection";
import { MethodologyTransferSection } from "./MethodologyTransferSection";

type Phase = "understand" | "learn" | "test";

const phaseTabs: { phase: Phase; label: string; tabs: { value: string; label: string; icon: typeof BookOpen }[] }[] = [
  {
    phase: "understand",
    label: "Understand",
    tabs: [
      { value: "spine", label: "Argument Spine", icon: GitBranch },
      { value: "summary", label: "Summary", icon: BookOpen },
      { value: "contributions", label: "Key Contributions", icon: Star },
      { value: "eli12", label: "ELI12", icon: Lightbulb },
    ],
  },
  {
    phase: "learn",
    label: "Learn",
    tabs: [
      { value: "concepts", label: "Concepts", icon: List },
      { value: "flashcards", label: "Flashcards", icon: Layers },
      { value: "methodology", label: "Apply methodology", icon: Sparkles },
      { value: "ask", label: "Ask", icon: MessageCircle },
    ],
  },
  {
    phase: "test",
    label: "Test",
    tabs: [{ value: "quiz", label: "Quiz", icon: Brain }],
  },
];

interface ResultsViewProps {
  result: AnalysisResult;
  slug?: string;
  extractedText?: string;
}

export function ResultsView({ result, slug, extractedText }: ResultsViewProps) {
  const hasSpine = result.argumentSpine != null && result.argumentSpine.length > 0;
  const [phase, setPhase] = useState<Phase>("understand");
  const [activeTab, setActiveTab] = useState(hasSpine ? "spine" : "summary");
  const [copied, setCopied] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [extractedOpen, setExtractedOpen] = useState(false);
  const citationsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const currentPhaseConfig = phaseTabs.find((p) => p.phase === phase)!;
  const visibleTabs = currentPhaseConfig.tabs.filter((t) => {
    if (t.value === "spine" && !hasSpine) return false;
    return true;
  });
  const activeTabInPhase = visibleTabs.some((t) => t.value === activeTab);
  const effectiveTab = activeTabInPhase ? activeTab : visibleTabs[0]?.value ?? "summary";

  useEffect(() => {
    if (!activeTabInPhase && visibleTabs.length) {
      setActiveTab(visibleTabs[0].value);
    }
  }, [phase, activeTabInPhase, visibleTabs]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [effectiveTab]);

  const handlePhaseChange = (p: Phase) => {
    setPhase(p);
    const config = phaseTabs.find((x) => x.phase === p)!;
    const first = config.tabs.find((t) => t.value !== "spine" || hasSpine) ?? config.tabs[0];
    setActiveTab(first?.value ?? "summary");
  };

  const handleDownloadPDF = () => {
    alert("Download as PDF coming soon!");
  };

  const handleShare = useCallback(async () => {
    if (!slug) return;
    const url = `${window.location.origin}/share/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slug]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      {(result.parseQualityWarning || (result.analysisConfidence !== undefined && result.analysisConfidence <= 3)) && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            {result.parseQualityWarning && result.analysisConfidence !== undefined && result.analysisConfidence <= 3 && (
              <p>
                Some equations and tables may not have parsed correctly. The Summary and Key Contributions are likely accurate; check Concepts against the original PDF if they reference formulas.
              </p>
            )}
            {result.parseQualityWarning && !(result.analysisConfidence !== undefined && result.analysisConfidence <= 3) && (
              <p>
                {result.parseQualityWarning} The Summary and Key Contributions are likely accurate; check Concepts and formulas against the original PDF.
              </p>
            )}
            {!(result.parseQualityWarning) && result.analysisConfidence !== undefined && result.analysisConfidence <= 3 && (
              <p>
                Some equations and tables may not have parsed correctly. Summary and Key Contributions are likely accurate; verify Concepts that reference formulas.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-4xl font-heading text-foreground mb-2">
            Analysis Results
          </h2>
          <p className="text-muted-foreground">
            Your research paper has been analyzed and simplified
            {result.paperDomain && result.paperType && (
              <> · {result.paperDomain} · {result.paperType}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {slug && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Share2 className="h-4 w-4" />
              {copied ? "Copied!" : "Copy link"}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </motion.button>
          <div className="relative" ref={citationsRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCitationsOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <BookMarked className="h-4 w-4" />
              Citations
            </motion.button>
            {citationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setCitationsOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-[min(90vw,420px)] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  <div className="max-h-[60vh] overflow-y-auto p-4">
                    <CitationsSection citations={result.citations ?? []} />
                  </div>
                </div>
              </>
            )}
          </div>
          {extractedText && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExtractedOpen((o) => !o)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
                extractedOpen ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <FileText className="h-4 w-4" />
              Raw text
            </motion.button>
          )}
        </div>
      </div>

      {extractedOpen && extractedText && (
        <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setExtractedOpen(false)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 text-left"
          >
            <span className="font-medium text-foreground">Extracted text from PDF</span>
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          </button>
          <pre className="max-h-[400px] overflow-auto border-t border-border bg-muted/30 p-4 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
            {extractedText}
          </pre>
        </div>
      )}

      <Tabs value={effectiveTab} onValueChange={setActiveTab}>
        <div className="mb-4 flex flex-wrap gap-2">
          {phaseTabs.map((p) => (
            <button
              key={p.phase}
              type="button"
              onClick={() => handlePhaseChange(p.phase)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                phase === p.phase
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <TabsList className="mb-8 flex gap-2 w-full bg-transparent p-0 h-auto overflow-x-auto overflow-y-hidden scroll-smooth scroll-snap-x scroll-snap-mandatory [scrollbar-width:thin]">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = effectiveTab === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                ref={isActive ? activeTabRef : undefined}
                value={tab.value}
                className="relative flex items-center gap-2 rounded-xl px-4 py-3 transition-all shrink-0 scroll-snap-center bg-card text-foreground hover:bg-muted border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {hasSpine && (
          <TabsContent value="spine" className="mt-0 focus:outline-none">
            <ArgumentSpineView
              spine={result.argumentSpine!}
              concepts={result.concepts}
              extractedText={extractedText}
              slug={slug}
              vulnerabilityMap={result.vulnerabilityMap}
            />
          </TabsContent>
        )}
        <TabsContent value="summary" className="mt-0 focus:outline-none">
          <SummarySection summary={result.summary} />
        </TabsContent>
        <TabsContent value="contributions" className="mt-0 focus:outline-none">
          <KeyContributions contributions={result.keyContributions} />
        </TabsContent>
        <TabsContent value="concepts" className="mt-0 focus:outline-none">
          <ConceptsExplainer concepts={result.concepts} />
        </TabsContent>
        <TabsContent value="eli12" className="mt-0 focus:outline-none">
          <ELI12Section eli12={result.eli12} />
        </TabsContent>
        <TabsContent value="methodology" className="mt-0 focus:outline-none">
          <MethodologyTransferSection
            slug={slug}
            initialSuggestions={result.methodologyTransfer}
          />
        </TabsContent>
        <TabsContent value="ask" className="mt-0 focus:outline-none">
          <AskSection
            slug={slug}
            suggestedQuestions={result.suggestedQuestions}
            topicOrMethodLine={
              result.topicOrMethodLine
                ?? (result.summary?.split(/[.!?]/)[0]
                  ? `${result.summary.split(/[.!?]/)[0].trim()}.`
                  : result.paperDomain
                    ? `This paper covers ${result.paperDomain}. Here are good starting points:`
                    : undefined)
            }
          />
        </TabsContent>
        <TabsContent value="flashcards" className="mt-0 focus:outline-none">
          <FlashcardsView
            concepts={result.concepts}
            slug={slug}
            argumentSpine={result.argumentSpine}
          />
        </TabsContent>
        <TabsContent value="quiz" className="mt-0 focus:outline-none">
          <QuizSection
            quizQuestions={result.quizQuestions}
            slug={slug}
            argumentSpine={result.argumentSpine}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
