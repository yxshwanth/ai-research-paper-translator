"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Shuffle, ChevronDown, ChevronUp } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import type { AnalysisResult } from "@/lib/types";
import type { ArgumentSpineNode } from "@/lib/types";

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

interface FlashcardsViewProps {
  concepts: AnalysisResult["concepts"];
  slug?: string;
  argumentSpine?: ArgumentSpineNode[];
}

export function FlashcardsView({ concepts, slug, argumentSpine }: FlashcardsViewProps) {
  const { user } = useUser();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [dueIndices, setDueIndices] = useState<number[] | null>(null);

  const conceptToRoles = useMemo(() => {
    if (!argumentSpine?.length) return new Map<number, string[]>();
    const map = new Map<number, string[]>();
    concepts.forEach((_, conceptIndex) => {
      const roles: string[] = [];
      argumentSpine.forEach((node) => {
        if (node.relevantConceptIndices?.includes(conceptIndex)) {
          roles.push(ROLE_LABELS[node.role]);
        }
      });
      if (roles.length) map.set(conceptIndex, [...new Set(roles)]);
    });
    return map;
  }, [argumentSpine, concepts]);

  const ordered = useMemo(() => {
    return concepts.map((c, i) => ({ concept: c, originalIndex: i }));
  }, [concepts]);

  const shuffledOrder = useMemo(() => {
    // Default: worst-first when we have spaced rep data (due cards = struggled with)
    if (!shuffled && dueIndices && dueIndices.length > 0) {
      const dueSet = new Set(dueIndices);
      const due = ordered.filter((o) => dueSet.has(o.originalIndex));
      const notDue = ordered.filter((o) => !dueSet.has(o.originalIndex));
      return [...due, ...notDue];
    }
    if (!shuffled) return ordered;
    const copy = [...ordered];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [ordered, shuffled, dueIndices]);

  const dueCount = dueIndices?.length ?? null;

  const current = shuffledOrder[index];
  const concept = current?.concept;
  const originalIndex = current?.originalIndex ?? 0;
  const total = shuffledOrder.length;

  useEffect(() => {
    if (!user?.sub || !slug) return;
    fetch(`/api/flashcards?slug=${encodeURIComponent(slug)}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.dueIndices && setDueIndices(data.dueIndices))
      .catch(() => {});
  }, [user?.sub, slug]);

  const handlePrev = () => {
    setFlipped(false);
    setIndex((i) => (i <= 0 ? total - 1 : i - 1));
  };

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i >= total - 1 ? 0 : i + 1));
  };

  const toggleShuffle = () => {
    setShuffled((s) => !s);
    setIndex(0);
    setFlipped(false);
  };

  const submitRating = async (rating: string) => {
    if (!slug || !user) return;
    const res = await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug, conceptIndex: originalIndex, rating }),
    });
    if (res.ok && dueIndices?.length) {
      setDueIndices((prev) =>
        prev ? prev.filter((i) => i !== originalIndex) : null
      );
    }
    setFlipped(false);
    setIndex((i) => (i >= total - 1 ? 0 : i + 1));
  };

  if (!concepts?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        No concepts to show as flashcards.
      </div>
    );
  }

  const spineRoles = conceptToRoles.get(originalIndex) ?? [];
  const spineLine =
    spineRoles.length > 0
      ? `This concept is part of the ${spineRoles.join(" and ")} step${spineRoles.length > 1 ? "s" : ""}.`
      : null;

  return (
    <div className="space-y-6">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-accent"
          initial={false}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOptionsOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {optionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Options
        </button>
        {optionsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex flex-wrap items-center gap-3 overflow-hidden"
          >
            {user && slug && dueCount !== null && dueCount > 0 && (
              <p className="text-sm text-accent">Due for review: {dueCount}</p>
            )}
            <button
              type="button"
              onClick={toggleShuffle}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                shuffled
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-foreground hover:border-accent/50"
              }`}
            >
              <Shuffle className="h-4 w-4" />
              {shuffled ? "Shuffle on" : dueIndices?.length ? "Worst first" : "Shuffle"}
            </button>
          </motion.div>
        )}
      </div>

      <div
        className="relative min-h-[280px] w-full max-w-lg mx-auto overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-[280px] cursor-pointer"
          >
            <motion.div
              className="relative w-full h-full"
              onClick={() => setFlipped((f) => !f)}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-accent/50 bg-gradient-to-br from-accent/10 to-accent/5 p-8 shadow-lg"
                style={{ backfaceVisibility: "hidden" }}
              >
                {spineRoles.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                    {spineRoles.map((r) => (
                      <span
                        key={r}
                        className="rounded-md border border-accent/50 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm font-medium text-accent uppercase tracking-wide mb-2">
                  Term
                </p>
                <p className="text-2xl font-heading text-center text-foreground">
                  {concept.term}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click to flip
                </p>
              </div>
              <div
                className="absolute inset-0 flex flex-col rounded-2xl border-2 border-border bg-card p-8 shadow-lg overflow-y-auto"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-sm font-medium text-accent uppercase tracking-wide mb-2">
                  {concept.term}
                </p>
                {spineLine && (
                  <p className="text-sm text-muted-foreground mb-3 italic">{spineLine}</p>
                )}
                <div className="text-base leading-relaxed text-foreground/90 space-y-2">
                  {concept.explanation.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click to flip back
                </p>
                {user && slug && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["again", "hard", "good", "easy"] as const).map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          submitRating(rating);
                        }}
                        className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium capitalize text-foreground hover:bg-muted"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous card"
          className="rounded-xl border-2 border-border bg-card p-3 text-foreground transition-colors hover:border-accent/50 hover:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next card"
          className="rounded-xl border-2 border-border bg-card p-3 text-foreground transition-colors hover:border-accent/50 hover:bg-muted"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
