"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  BookOpen,
  Quote,
  HelpCircle,
  Loader2,
  Check,
  ShieldAlert,
} from "lucide-react";
import type { ArgumentSpineNode, VulnerabilityMap, VulnerabilityNode } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY_PREFIX = "paper-explainer-spine-got-it-";

interface ArgumentSpineViewProps {
  spine: ArgumentSpineNode[];
  concepts: { term: string; explanation: string }[];
  extractedText?: string;
  slug?: string;
  vulnerabilityMap?: VulnerabilityMap;
}

const ROLE_LABELS: Record<ArgumentSpineNode["role"], string> = {
  problem: "Problem",
  gap: "Gap",
  hypothesis: "Hypothesis",
  method: "Method",
  evidence: "Evidence",
  conclusion: "Conclusion",
  limitation: "Limitation",
  implication: "Implication",
};

const STRENGTH_STYLES = {
  strong: "border-green-500/60 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200",
  moderate: "border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  weak: "border-red-500/50 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200",
};

const FRAGILITY_STYLES: Record<number, string> = {
  1: "bg-green-500/20 text-green-700 dark:text-green-300",
  2: "bg-green-500/15 text-green-600 dark:text-green-400",
  3: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  4: "bg-red-500/20 text-red-700 dark:text-red-300",
  5: "bg-red-500/30 text-red-800 dark:text-red-200",
};

function loadGotItFromStorage(slug: string | undefined): Set<number> {
  if (typeof window === "undefined" || !slug) return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + slug);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function ArgumentSpineView({
  spine,
  concepts,
  slug,
  vulnerabilityMap: initialVulnerabilityMap,
}: ArgumentSpineViewProps) {
  const [vulnerabilityMap, setVulnerabilityMap] = useState<VulnerabilityMap | null>(
    initialVulnerabilityMap?.nodes?.length ? initialVulnerabilityMap : null
  );
  const [vulnerabilityLoading, setVulnerabilityLoading] = useState(false);
  const [vulnerabilityError, setVulnerabilityError] = useState<string | null>(null);
  const [expandedVulnerability, setExpandedVulnerability] = useState<number | null>(null);
  const [gotItSet, setGotItSet] = useState<Set<number>>(() => new Set());
  const [comprehensionInputs, setComprehensionInputs] = useState<Record<number, string>>({});
  const [comprehensionState, setComprehensionState] = useState<{
    nodeIndex: number;
    loading: boolean;
    understood: boolean | null;
    feedback: string;
    userAnswer: string;
  } | null>(null);

  useEffect(() => {
    setGotItSet(loadGotItFromStorage(slug));
  }, [slug]);

  const persistGotIt = useCallback(
    (next: Set<number>) => {
      if (slug && typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_PREFIX + slug, JSON.stringify([...next]));
        } catch {}
      }
    },
    [slug]
  );

  const markGotIt = useCallback(
    (nodeIndex: number) => {
      setGotItSet((prev) => {
        const next = new Set(prev);
        next.add(nodeIndex);
        persistGotIt(next);
        return next;
      });
    },
    [persistGotIt]
  );

  const handleComprehensionSubmit = async (nodeIndex: number, userAnswer: string) => {
    if (!slug || !userAnswer.trim()) return;
    setComprehensionState({
      nodeIndex,
      loading: true,
      understood: null,
      feedback: "",
      userAnswer,
    });
    try {
      const res = await fetch("/api/paper/spine-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug, nodeIndex, userAnswer: userAnswer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComprehensionState((s) =>
          s?.nodeIndex === nodeIndex
            ? { ...s, loading: false, understood: false, feedback: data.error ?? "Request failed." }
            : s
        );
        return;
      }
      const understood = data.understood ?? false;
      setComprehensionState((s) =>
        s?.nodeIndex === nodeIndex
          ? { ...s, loading: false, understood, feedback: data.feedback ?? "" }
          : s
      );
      if (understood) markGotIt(nodeIndex);
    } catch {
      setComprehensionState((s) =>
        s?.nodeIndex === nodeIndex
          ? { ...s, loading: false, understood: false, feedback: "Something went wrong." }
          : s
      );
    }
  };

  const handleAnalyzeVulnerabilities = async () => {
    if (!slug) return;
    setVulnerabilityLoading(true);
    setVulnerabilityError(null);
    try {
      const res = await fetch("/api/paper/vulnerability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to analyze");
      setVulnerabilityMap(data);
    } catch (err) {
      setVulnerabilityError(err instanceof Error ? err.message : "Failed to analyze vulnerabilities.");
    } finally {
      setVulnerabilityLoading(false);
    }
  };

  const getVulnerabilityForNode = (index: number): VulnerabilityNode | undefined =>
    vulnerabilityMap?.nodes.find((n) => n.spineIndex === index);

  const understoodCount = gotItSet.size;
  const totalSteps = spine.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {totalSteps > 0 && (
          <p className="text-sm text-muted-foreground">
            {understoodCount} of {totalSteps} steps understood
          </p>
        )}
        {slug && !vulnerabilityMap && (
          <button
            type="button"
            onClick={handleAnalyzeVulnerabilities}
            disabled={vulnerabilityLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {vulnerabilityLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing vulnerabilities…
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Analyze vulnerabilities
              </>
            )}
          </button>
        )}
        {vulnerabilityError && (
          <p className="text-sm text-destructive">{vulnerabilityError}</p>
        )}
      </div>
      <div className="relative">
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"
          aria-hidden
        />
        {spine.map((node, index) => {
          const relevantConcepts = node.relevantConceptIndices
            .filter((i) => i >= 0 && i < concepts.length)
            .map((i) => concepts[i]);
          const compState = comprehensionState?.nodeIndex === index ? comprehensionState : null;
          const isGotIt = gotItSet.has(index);
          const vuln = getVulnerabilityForNode(index);
          const isVulnExpanded = expandedVulnerability === index;

          return (
            <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
              <div
                className={cn(
                  "relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-background text-sm font-medium",
                  isGotIt ? "border-green-500/60 bg-green-500/10 text-green-700 dark:text-green-300" : "border-accent/60 text-accent"
                )}
              >
                {isGotIt ? <Check className="h-5 w-5" /> : index + 1}
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <Card className="overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                          index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {ROLE_LABELS[node.role]}
                      </span>
                      {vuln && (
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-medium",
                            FRAGILITY_STYLES[vuln.fragilityScore] ?? FRAGILITY_STYLES[3]
                          )}
                        >
                          Fragility: {vuln.fragilityScore}/5
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-base font-medium leading-snug text-foreground">
                      {node.claim}
                    </p>
                    {index < spine.length - 1 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {node.connectionToNext}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 text-xs font-medium",
                              STRENGTH_STYLES[node.connectionStrength]
                            )}
                          >
                            {node.connectionStrength}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {node.strengthJustification}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="border-t border-border pt-4 space-y-6">
                    {relevantConcepts.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                          <BookOpen className="h-4 w-4 text-accent" />
                          Relevant concepts
                        </h4>
                        <ul className="space-y-2">
                          {relevantConcepts.map((c, i) => (
                            <li
                              key={i}
                              className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-foreground">{c.term}</span>
                              <p className="mt-1 text-muted-foreground">{c.explanation.slice(0, 200)}{c.explanation.length > 200 ? "…" : ""}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {node.supportingExcerpt && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                          <Quote className="h-4 w-4 text-accent" />
                          From the paper
                        </h4>
                        <blockquote className="rounded-lg border-l-4 border-accent/50 bg-muted/30 py-2 pl-4 pr-3 text-sm italic text-foreground/90">
                          {node.supportingExcerpt}
                        </blockquote>
                      </div>
                    )}

                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                        <HelpCircle className="h-4 w-4 text-accent" />
                        Why this step matters
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {node.whyThisStepMatters ?? node.connectionToNext}
                      </p>
                    </div>

                    {node.comprehensionQuestion && (
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <h4 className="mb-2 text-sm font-medium text-foreground">
                          Check your understanding
                        </h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {node.comprehensionQuestion}
                        </p>
                        {slug ? (
                          <>
                            <textarea
                              placeholder="Type your answer..."
                              value={comprehensionInputs[index] ?? ""}
                              onChange={(e) =>
                                setComprehensionInputs((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }))
                              }
                              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                              rows={3}
                              disabled={compState?.loading}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  const value = (comprehensionInputs[index] ?? "").trim();
                                  if (value) handleComprehensionSubmit(index, value);
                                }
                              }}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={compState?.loading || !(comprehensionInputs[index] ?? "").trim()}
                                onClick={() => {
                                  const value = (comprehensionInputs[index] ?? "").trim();
                                  if (value) handleComprehensionSubmit(index, value);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              >
                                {compState?.loading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking…
                                  </>
                                ) : (
                                  "Submit"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => markGotIt(index)}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                              >
                                <Check className="h-4 w-4" />
                                Got it
                              </button>
                            </div>
                            {compState && !compState.loading && compState.feedback && (
                              <div
                                className={cn(
                                  "mt-3 flex gap-2 rounded-lg p-3 text-sm",
                                  compState.understood
                                    ? "bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-200"
                                    : "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                                )}
                              >
                                {compState.understood ? (
                                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                )}
                                <p>{compState.feedback}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Save or share this analysis to get feedback on your answer.
                          </p>
                        )}
                      </div>
                    )}

                    {vuln && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedVulnerability((v) => (v === index ? null : index))}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-500/10"
                        >
                          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                            What would break this?
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {isVulnExpanded ? "Collapse" : "Expand"}
                          </span>
                        </button>
                        {isVulnExpanded && (
                          <div className="border-t border-amber-500/20 p-4 space-y-3 text-sm">
                            {vuln.assumptionsThatWouldCollapse.length > 0 && (
                              <div>
                                <p className="font-medium text-foreground mb-1">Assumptions that would collapse conclusions:</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                  {vuln.assumptionsThatWouldCollapse.map((a, i) => (
                                    <li key={i}>{a}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vuln.dataThatWouldContradict && (
                              <div>
                                <p className="font-medium text-foreground mb-1">Data that would contradict:</p>
                                <p className="text-muted-foreground">{vuln.dataThatWouldContradict}</p>
                              </div>
                            )}
                            {vuln.alternativeExplanationsNotAddressed && (
                              <div>
                                <p className="font-medium text-foreground mb-1">Alternative explanations not addressed:</p>
                                <p className="text-muted-foreground">{vuln.alternativeExplanationsNotAddressed}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!node.comprehensionQuestion && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markGotIt(index)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          <Check className="h-4 w-4" />
                          Got it
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
