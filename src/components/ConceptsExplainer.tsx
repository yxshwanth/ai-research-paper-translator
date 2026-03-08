"use client";

import { BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Concept {
  term: string;
  explanation: string;
}

interface ConceptsExplainerProps {
  concepts: Concept[];
}

export function ConceptsExplainer({ concepts }: ConceptsExplainerProps) {
  return (
    <Accordion className="space-y-3 w-full">
      {concepts.map((concept, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-accent/50"
        >
          <AccordionTrigger className="group flex w-full items-center justify-between px-6 py-4 text-left transition-all hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-accent" />
              <span className="font-medium text-foreground">{concept.term}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden px-6 pb-4">
            <div className="pt-2 text-base leading-relaxed text-foreground/80 pl-8 space-y-2">
              {concept.explanation.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
