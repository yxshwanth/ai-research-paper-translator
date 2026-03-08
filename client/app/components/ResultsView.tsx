import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import { Download, BookOpen, Star, List, Lightbulb, Brain } from "lucide-react";
import { AnalysisResult } from "../lib/types";
import { SummarySection } from "./SummarySection";
import { KeyContributions } from "./KeyContributions";
import { ConceptsExplainer } from "./ConceptsExplainer";
import { ELI12Section } from "./ELI12Section";
import { QuizSection } from "./QuizSection";

interface ResultsViewProps {
  result: AnalysisResult;
}

const tabs = [
  { value: "summary", label: "Summary", icon: BookOpen },
  { value: "contributions", label: "Key Contributions", icon: Star },
  { value: "concepts", label: "Concepts", icon: List },
  { value: "eli12", label: "ELI12", icon: Lightbulb },
  { value: "quiz", label: "Quiz", icon: Brain },
];

export function ResultsView({ result }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState("summary");

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
          className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </motion.button>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        {/* Tab List */}
        <Tabs.List className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={`
                  relative flex items-center gap-2 rounded-xl px-4 py-3 transition-all
                  ${
                    activeTab === tab.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-foreground hover:bg-muted border border-border"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs.Content value="summary" className="focus:outline-none">
              <SummarySection summary={result.summary} />
            </Tabs.Content>

            <Tabs.Content value="contributions" className="focus:outline-none">
              <KeyContributions contributions={result.keyContributions} />
            </Tabs.Content>

            <Tabs.Content value="concepts" className="focus:outline-none">
              <ConceptsExplainer concepts={result.concepts} />
            </Tabs.Content>

            <Tabs.Content value="eli12" className="focus:outline-none">
              <ELI12Section eli12={result.eli12} />
            </Tabs.Content>

            <Tabs.Content value="quiz" className="focus:outline-none">
              <QuizSection quizQuestions={result.quizQuestions} />
            </Tabs.Content>
          </motion.div>
        </AnimatePresence>
      </Tabs.Root>
    </motion.div>
  );
}
