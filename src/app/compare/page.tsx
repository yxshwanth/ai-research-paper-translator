"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { motion } from "framer-motion";
import { ArrowLeft, GitCompare, Loader2, Check } from "lucide-react";
import { CrossPaperComparisonView } from "@/components/CrossPaperComparisonView";
import type { CrossPaperComparison } from "@/lib/types";

interface AnalysisItem {
  slug: string;
  fileName: string | null;
  createdAt: string;
}

export default function ComparePage() {
  const { user, isLoading: userLoading } = useUser();
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [guestSlugs, setGuestSlugs] = useState("");
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<CrossPaperComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/analyses", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/auth/login";
          return null;
        }
        if (!res.ok) throw new Error("Failed to load papers");
        return res.json();
      })
      .then((data) => {
        if (data) setAnalyses(data.analyses ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleSlug = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < 5) {
        next.add(slug);
      }
      return next;
    });
  };

  const getSlugsToCompare = (): string[] => {
    if (user && selectedSlugs.size >= 2) {
      return [...selectedSlugs];
    }
    const parsed = guestSlugs
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const fromUrls = parsed.flatMap((s) => {
      const m = s.match(/\/share\/([a-zA-Z0-9_-]+)/);
      return m ? [m[1]] : s.length >= 6 ? [s] : [];
    });
    return [...new Set(fromUrls)].slice(0, 5);
  };

  const slugsToCompare = getSlugsToCompare();
  const canCompare = slugsToCompare.length >= 2;

  const handleCompare = async () => {
    if (!canCompare) return;
    setComparing(true);
    setError(null);
    setComparison(null);
    try {
      const res = await fetch("/api/paper/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: slugsToCompare }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to compare");
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare papers.");
    } finally {
      setComparing(false);
    }
  };

  const slugToFileName: Record<string, string> = {};
  analyses.forEach((a) => {
    slugToFileName[a.slug] = a.fileName ?? a.slug;
  });
  slugsToCompare.forEach((s) => {
    if (!slugToFileName[s]) slugToFileName[s] = s;
  });

  if (userLoading || (!user && loading)) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-heading text-foreground flex items-center gap-3">
            <GitCompare className="h-10 w-10 text-accent" />
            Compare papers
          </h1>
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {user ? "My papers" : "Home"}
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
            {error}
          </p>
        )}

        {!comparison ? (
          <div className="space-y-6">
            {user && analyses.length > 0 ? (
              <div>
                <h2 className="text-lg font-medium text-foreground mb-3">
                  Select 2–5 papers to compare
                </h2>
                <ul className="space-y-2">
                  {analyses.map((a) => (
                    <li
                      key={a.slug}
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSlug(a.slug)}
                        className={`flex h-6 w-6 rounded border flex-shrink-0 items-center justify-center transition-colors ${
                          selectedSlugs.has(a.slug)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {selectedSlugs.has(a.slug) ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                      <span className="flex-1 truncate font-medium text-foreground">
                        {a.fileName ?? a.slug}
                      </span>
                      <Link
                        href={`/share/${a.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-medium text-foreground mb-3">
                  Enter 2–5 analysis slugs or share URLs
                </h2>
                <textarea
                  placeholder="Paste slugs or share URLs, one per line or comma-separated:&#10;abc123xyz&#10;def456uvw&#10;https://yoursite.com/share/ghi789rst"
                  value={guestSlugs}
                  onChange={(e) => setGuestSlugs(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none min-h-[120px]"
                  rows={4}
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCompare}
                disabled={!canCompare || comparing}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {comparing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-5 w-5" />
                    Compare
                  </>
                )}
              </button>
              {!canCompare && (
                <p className="text-sm text-muted-foreground">
                  Select or enter at least 2 papers to compare.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setComparison(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Compare different papers
              </button>
            </div>
            <CrossPaperComparisonView
              comparison={comparison}
              slugToFileName={slugToFileName}
            />
          </div>
        )}

        {user && analyses.length === 0 && !comparison && (
          <p className="mt-8 text-center text-muted-foreground">
            You have no saved analyses.{" "}
            <Link href="/" className="text-accent hover:underline">
              Analyze a paper
            </Link>{" "}
            first, or use the slug input above to compare papers by slug.
          </p>
        )}
      </motion.div>
    </div>
  );
}
