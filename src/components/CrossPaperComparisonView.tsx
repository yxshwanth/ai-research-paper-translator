"use client";

import { motion } from "framer-motion";
import { AlertTriangle, GitBranch, FileText } from "lucide-react";
import type { CrossPaperComparison, ContradictionPoint, SpineDivergence } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const CONTRADICTION_TYPE_LABELS: Record<ContradictionPoint["type"], string> = {
  conclusion: "Conclusion",
  methodology: "Methodology",
  assumption: "Assumption",
  citation_interpretation: "Citation interpretation",
};

interface CrossPaperComparisonViewProps {
  comparison: CrossPaperComparison;
  slugToFileName?: Record<string, string>;
}

export function CrossPaperComparisonView({
  comparison,
  slugToFileName = {},
}: CrossPaperComparisonViewProps) {
  const { contradictions, spineDivergence, sharedCitationsInterpretation } = comparison;

  return (
    <div className="space-y-8">
      {contradictions.length > 0 && (
        <section>
          <h3 className="text-xl font-heading text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Contradictions
          </h3>
          <div className="space-y-3">
            {contradictions.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-amber-500/30 bg-amber-500/5 overflow-hidden">
                  <CardHeader className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-amber-500/50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        {CONTRADICTION_TYPE_LABELS[c.type]}
                      </span>
                      {c.paperSlugs.map((slug) => (
                        <span
                          key={slug}
                          className="text-xs text-muted-foreground"
                        >
                          {slugToFileName[slug] ?? slug}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-foreground">{c.description}</p>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {spineDivergence.length > 0 && (
        <section>
          <h3 className="text-xl font-heading text-foreground mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            Argument spine divergence
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-foreground">Role</th>
                  {Object.keys(spineDivergence[0]?.papersByClaim ?? {}).map((slug) => (
                    <th key={slug} className="text-left p-3 font-medium text-foreground max-w-[200px]">
                      {slugToFileName[slug] ?? slug}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spineDivergence.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-foreground capitalize align-top">
                      {s.role}
                    </td>
                    {Object.entries(s.papersByClaim).map(([slug, claim]) => (
                      <td key={slug} className="p-3 text-muted-foreground align-top max-w-[200px]">
                        {claim}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {spineDivergence.some((s) => s.divergenceNote) && (
            <div className="mt-3 space-y-2">
              {spineDivergence
                .filter((s) => s.divergenceNote)
                .map((s, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    <span className="font-medium capitalize text-foreground">{s.role}:</span>{" "}
                    {s.divergenceNote}
                  </p>
                ))}
            </div>
          )}
        </section>
      )}

      {sharedCitationsInterpretation && (
        <section>
          <h3 className="text-xl font-heading text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Shared citations
          </h3>
          <Card className="border-border overflow-hidden">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {sharedCitationsInterpretation}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {contradictions.length === 0 &&
        spineDivergence.length === 0 &&
        !sharedCitationsInterpretation && (
          <p className="text-muted-foreground text-center py-8">
            No significant contradictions or divergences found between these papers.
          </p>
        )}
    </div>
  );
}
