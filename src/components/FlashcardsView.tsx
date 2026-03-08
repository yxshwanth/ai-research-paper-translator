"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import type { AnalysisResult } from "@/lib/types";

interface FlashcardsViewProps {
  concepts: AnalysisResult["concepts"];
  slug?: string;
}

export function FlashcardsView({ concepts, slug }: FlashcardsViewProps) {
  const { user } = useUser();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [dueCount, setDueCount] = useState<number | null>(null);

  const ordered = useMemo(() => {
    return concepts.map((c, i) => ({ concept: c, originalIndex: i }));
  }, [concepts]);

  const shuffledOrder = useMemo(() => {
    if (!shuffled) return ordered;
    const copy = [...ordered];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [ordered, shuffled]);

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
      .then((data) => data?.dueIndices && setDueCount(data.dueIndices.length))
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
    if (res.ok && dueCount !== null) setDueCount(Math.max(0, dueCount - 1));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Card {index + 1} of {total}
          </p>
          {user && slug && dueCount !== null && dueCount > 0 && (
            <p className="text-sm text-accent">
              Due for review: {dueCount}
            </p>
          )}
        </div>
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
          Shuffle
        </button>
      </div>

      <div
        className="min-h-[220px] flex items-stretch justify-center"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="relative w-full max-w-lg h-[280px] cursor-pointer"
          onClick={() => setFlipped((f) => !f)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-accent/50 bg-gradient-to-br from-accent/10 to-accent/5 p-8 shadow-lg"
            style={{ backfaceVisibility: "hidden" }}
          >
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
                    onClick={() => submitRating(rating)}
                    className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium capitalize text-foreground hover:bg-muted"
                  >
                    {rating}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
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
