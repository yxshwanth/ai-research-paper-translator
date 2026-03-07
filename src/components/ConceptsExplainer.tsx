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
    <Accordion className="w-full">
      {concepts.map((concept, index) => (
        <AccordionItem key={index} value={`concept-${index}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 text-left">
              <BookOpen className="h-4 w-4 text-[#1a2332] shrink-0" />
              <span className="font-medium text-[#1a2332]">{concept.term}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-[#1a2332]/80 pl-6 leading-relaxed">
              {concept.explanation}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
