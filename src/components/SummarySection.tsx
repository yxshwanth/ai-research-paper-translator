"use client";

import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummarySectionProps {
  summary: string;
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <Card className="border-[#e8e4dc] bg-[#FAFAF7] shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#1a2332]/5 p-2 shrink-0">
            <BookOpen className="h-5 w-5 text-[#1a2332]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg text-[#1a2332] leading-relaxed">{summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
