"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { MethodologyTransferSuggestion } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MethodologyTransferSectionProps {
  slug?: string;
  initialSuggestions?: MethodologyTransferSuggestion[];
}

export function MethodologyTransferSection({
  slug,
  initialSuggestions,
}: MethodologyTransferSectionProps) {
  const [suggestions, setSuggestions] = useState<MethodologyTransferSuggestion[]>(
    initialSuggestions ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paper/methodology-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  };

  if (!slug) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Save or share your analysis to get methodology transfer suggestions.
        </p>
      </div>
    );
  }

  if (suggestions.length === 0 && !loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-xl font-heading text-foreground">
            Apply this methodology
          </h3>
          <p className="text-muted-foreground max-w-md">
            Get suggestions for adapting this paper&apos;s methodology to another domain&nbsp;—&nbsp;education, housing, climate, etc.
          </p>
          <Button onClick={handleFetch} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Generate suggestions
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <h3 className="text-2xl font-heading text-foreground">
          Apply this methodology
        </h3>
      </div>
      <p className="text-muted-foreground">
        How you could adapt this paper&apos;s approach to another domain:
      </p>
      {suggestions.map((s, i) => (
        <motion.div
          key={s.targetDomain}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-2">
              <h4 className="text-lg font-semibold text-foreground capitalize">
                Adapt to {s.targetDomain}
              </h4>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-foreground/90">
                {s.adaptationSteps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
              {s.keyConsiderations && (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  {s.keyConsiderations}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
