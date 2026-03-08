import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { BookOpen, ChevronDown } from "lucide-react";

interface ConceptsExplainerProps {
  concepts: { term: string; explanation: string }[];
}

export function ConceptsExplainer({ concepts }: ConceptsExplainerProps) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {concepts.map((concept, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-accent/50"
        >
          <AccordionTrigger className="group flex w-full items-center justify-between px-6 py-4 text-left transition-all hover:bg-muted/30 [&[data-state=open]]:bg-muted/50">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-accent" />
              <span className="font-medium text-foreground">{concept.term}</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden px-6 pb-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="pt-2 text-base leading-relaxed text-foreground/80 pl-8">
              {concept.explanation}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
