"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ELI12SectionProps {
  eli12: string;
}

export function ELI12Section({ eli12 }: ELI12SectionProps) {
  return (
    <Card className="border-l-4 border-l-amber-400 border-[#e8e4dc] bg-amber-50/50 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 shrink-0">
            <Lightbulb className="h-6 w-6 text-amber-700" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-lg text-[#1a2332] mb-2">
              Explain Like I&apos;m 12
            </h3>
            <p className="text-[#1a2332] leading-relaxed text-base">
              {eli12}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
