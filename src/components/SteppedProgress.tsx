"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

type Phase = "extracting" | "analyzing" | "finalizing";

const STEPS: { phase: Phase; label: string }[] = [
  { phase: "extracting", label: "Extracting text" },
  { phase: "analyzing", label: "Analyzing structure" },
  { phase: "finalizing", label: "Finalizing" },
];

interface SteppedProgressProps {
  currentPhase: Phase;
  extractingDone: boolean;
  analyzingDone: boolean;
}

export function SteppedProgress({
  currentPhase,
  extractingDone,
  analyzingDone,
}: SteppedProgressProps) {
  const finalizingDone = analyzingDone && currentPhase === "finalizing";

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const isExtracting = step.phase === "extracting";
            const isAnalyzing = step.phase === "analyzing";
            const isFinalizing = step.phase === "finalizing";
            const done =
              (isExtracting && extractingDone) ||
              (isAnalyzing && analyzingDone) ||
              (isFinalizing && finalizingDone);
            const current =
              (isExtracting && currentPhase === "extracting") ||
              (isAnalyzing && currentPhase === "analyzing") ||
              (isFinalizing && currentPhase === "finalizing");

            return (
              <div
                key={step.phase}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : current
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-5 w-5" />
                  ) : current ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <p
                  className={`text-base font-medium ${
                    done
                      ? "text-green-700 dark:text-green-400"
                      : current
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                  {current && !done && "…"}
                </p>
              </div>
            );
          })}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{
              width: `${(extractingDone ? 33 : 0) + (analyzingDone ? 33 : 0) + (finalizingDone ? 34 : 0)}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
