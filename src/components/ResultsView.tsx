"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, BookOpen, Star, List, Lightbulb, Brain } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { SummarySection } from "./SummarySection";
import { KeyContributions } from "./KeyContributions";
import { ConceptsExplainer } from "./ConceptsExplainer";
import { ELI12Section } from "./ELI12Section";
import { QuizSection } from "./QuizSection";

const tabs = [
  { value: "summary", label: "Summary", icon: BookOpen },
  { value: "contributions", label: "Key Contributions", icon: Star },
  { value: "concepts", label: "Concepts", icon: List },
  { value: "eli12", label: "ELI12", icon: Lightbulb },
  { value: "quiz", label: "Quiz", icon: Brain },
];

interface ResultsViewProps {
  result: AnalysisResult;
}

export function ResultsView({ result }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState("summary");

  const handleDownloadPDF = () => {
    alert("Download as PDF coming soon!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-heading text-foreground mb-2">
            Analysis Results
          </h2>
          <p className="text-muted-foreground">
            Your research paper has been analyzed and simplified
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadPDF}
          className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </motion.button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 flex flex-wrap gap-2 w-full bg-transparent p-0 h-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`
                  relative flex items-center gap-2 rounded-xl px-4 py-3 transition-all
                  ${isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-foreground hover:bg-muted border border-border"}
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

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
        <TabsContent value="quiz" className="mt-0 focus:outline-none">
          <QuizSection quizQuestions={result.quizQuestions} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
