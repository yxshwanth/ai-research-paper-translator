"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, BookMarked } from "lucide-react";
import type { CitationEntry } from "@/lib/types";

interface CitationsSectionProps {
  citations: CitationEntry[];
}

type Format = "apa" | "mla";

export function CitationsSection({ citations }: CitationsSectionProps) {
  const [format, setFormat] = useState<Format>("apa");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCitation = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!citations?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <BookMarked className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No citations were extracted from this paper.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Format:</span>
        <button
          type="button"
          onClick={() => setFormat("apa")}
          className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
            format === "apa"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-card text-foreground hover:border-accent/50"
          }`}
        >
          APA
        </button>
        <button
          type="button"
          onClick={() => setFormat("mla")}
          className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
            format === "mla"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-card text-foreground hover:border-accent/50"
          }`}
        >
          MLA
        </button>
      </div>

      <div className="space-y-3">
        {citations.map((citation, index) => {
          const text = format === "apa" ? citation.apa : citation.mla;
          const isCopied = copiedIndex === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/50 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                {text}
              </p>
              <button
                type="button"
                onClick={() => copyCitation(text, index)}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy citation
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
