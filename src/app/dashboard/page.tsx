"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { motion } from "framer-motion";
import { FileText, ExternalLink, ArrowLeft, GitCompare, Trash2, Loader2 } from "lucide-react";

interface AnalysisItem {
  slug: string;
  fileName: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

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

  const handleDelete = async (slug: string, fileName: string | null) => {
    if (!confirm(`Delete "${fileName ?? "this paper"}"? This cannot be undone.`)) return;
    setDeletingSlug(slug);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${slug}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete");
      }
      setAnalyses((prev) => prev.filter((a) => a.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete paper.");
    } finally {
      setDeletingSlug(null);
    }
  };

  if (userLoading || (!user && loading)) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center"
        >
          <h2 className="mb-4 text-2xl font-heading text-foreground">
            Log in to see your papers
          </h2>
          <p className="mb-6 text-muted-foreground">
            Sign in to view your saved analyses and share links.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Log in
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-4xl font-heading text-foreground">My Papers</h1>
          <div className="flex items-center gap-2">
            {analyses.length >= 2 && (
              <Link
                href="/compare"
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <GitCompare className="h-4 w-4" />
                Compare papers
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Analyze another
            </Link>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading your papers...</p>
        ) : analyses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-heading text-foreground">
              No papers yet
            </h3>
            <p className="mb-6 text-muted-foreground">
              Analyze a research paper to see it here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Analyze a paper
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {analyses.map((a) => (
              <li
                key={a.slug}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {a.fileName ?? "Untitled paper"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/share/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.slug, a.fileName)}
                    disabled={deletingSlug === a.slug}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    title="Delete paper"
                  >
                    {deletingSlug === a.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
