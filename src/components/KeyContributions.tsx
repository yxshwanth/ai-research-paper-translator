"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KeyContributionsProps {
  contributions: string[];
}

export function KeyContributions({ contributions }: KeyContributionsProps) {
  return (
    <div className="space-y-3">
      {contributions.map((contribution, index) => (
        <Card
          key={index}
          className="border-[#e8e4dc] bg-white hover:bg-[#FAFAF7] transition-colors"
        >
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a2332]/10 shrink-0">
                <span className="text-sm font-semibold text-[#1a2332]">
                  {index + 1}
                </span>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[#1a2332] mt-0.5 shrink-0" />
              <p className="text-[#1a2332] leading-relaxed flex-1">
                {contribution}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
