"use client";

import { Lightbulb } from "lucide-react";

interface ELI12SectionProps {
  eli12: string;
}

export function ELI12Section({ eli12 }: ELI12SectionProps) {
  return (
    <div className="rounded-2xl border-l-4 border-accent bg-gradient-to-br from-accent/5 to-accent/10 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
          <Lightbulb className="h-6 w-6 text-accent" />
        </div>
        <h3 className="text-2xl font-heading text-foreground">
          Explain Like I&apos;m 12
        </h3>
      </div>
      <p className="text-lg leading-relaxed text-foreground/90">{eli12}</p>
    </div>
  );
}
