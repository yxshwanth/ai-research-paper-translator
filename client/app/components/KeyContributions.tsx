import { Star } from "lucide-react";
import { motion } from "motion/react";

interface KeyContributionsProps {
  contributions: string[];
}

export function KeyContributions({ contributions }: KeyContributionsProps) {
  return (
    <div className="space-y-4">
      {contributions.map((contribution, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-md"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Star className="h-5 w-5 fill-accent" />
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-accent">
                  Contribution {index + 1}
                </span>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">
                {contribution}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
