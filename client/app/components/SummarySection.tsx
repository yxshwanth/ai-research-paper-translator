import { BookOpen } from "lucide-react";

interface SummarySectionProps {
  summary: string;
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-accent" />
        <h3 className="text-2xl font-heading text-foreground">Plain Language Summary</h3>
      </div>
      <p className="text-lg leading-relaxed text-foreground/90">
        {summary}
      </p>
    </div>
  );
}
