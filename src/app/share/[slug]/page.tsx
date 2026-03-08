"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ResultsView } from "@/components/ResultsView";
import type { AnalysisResult } from "@/lib/types";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface FetchedAnalysis {
  result: AnalysisResult;
  fileName: string | null;
  level: string | null;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<FetchedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    fetch(`/api/analyses/${slug}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Analysis not found.");
          throw new Error("Failed to load analysis.");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <main className="container mx-auto px-4 py-12 md:px-6">
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Loading analysis...</p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl rounded-2xl border border-destructive/50 bg-destructive/5 p-8 text-center"
          >
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-2xl font-heading text-foreground">
              Analysis not found
            </h2>
            <p className="mb-6 text-muted-foreground">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </motion.div>
        )}

        {data && !loading && (
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-xl font-heading text-foreground mb-1">
                {data.fileName ? data.fileName.replace(/\.pdf$/i, "") : "Research paper"}
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                {data.level ? `Analyzed at: ${data.level.charAt(0).toUpperCase() + data.level.slice(1)}` : "Shared with you"}
              </p>
              <p className="text-sm text-foreground/90">
                {data.result.summary?.split(/[.!?]/)[0]
                  ? `${data.result.summary.split(/[.!?]/)[0].trim()}.`
                  : "Paper analysis shared with you."}
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Analyze your own paper
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ResultsView result={data.result} slug={slug} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-accent bg-transparent px-8 py-3 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Analyze another paper
              </Link>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
