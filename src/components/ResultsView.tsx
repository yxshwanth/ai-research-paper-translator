"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { SummarySection } from "./SummarySection";
import { KeyContributions } from "./KeyContributions";
import { ConceptsExplainer } from "./ConceptsExplainer";
import { ELI12Section } from "./ELI12Section";
import { QuizSection } from "./QuizSection";

interface ResultsViewProps {
  result: AnalysisResult;
}

export function ResultsView({ result }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState("summary");

  const handleDownloadPDF = () => {
    // Placeholder for future PDF export
    alert("Download as PDF coming soon!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-[#1a2332]">
          Your Paper Breakdown
        </h2>
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          className="border-[#1a2332] text-[#1a2332] hover:bg-[#1a2332]/5"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Download as PDF
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap gap-2 bg-[#FAFAF7] border border-[#e8e4dc] p-1">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="contributions">Key Contributions</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          <TabsTrigger value="eli12">ELI12</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <SummarySection summary={result.summary} />
        </TabsContent>
        <TabsContent value="contributions" className="mt-6">
          <KeyContributions contributions={result.keyContributions} />
        </TabsContent>
        <TabsContent value="concepts" className="mt-6">
          <ConceptsExplainer concepts={result.concepts} />
        </TabsContent>
        <TabsContent value="eli12" className="mt-6">
          <ELI12Section eli12={result.eli12} />
        </TabsContent>
        <TabsContent value="quiz" className="mt-6">
          <QuizSection quizQuestions={result.quizQuestions} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
