"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FileText, Lightbulb, CheckCircle } from "lucide-react";

const statusMessages = [
  { text: "Reading your paper...", icon: FileText },
  { text: "Extracting key ideas...", icon: Brain },
  { text: "Generating quiz questions...", icon: Lightbulb },
  { text: "Almost done...", icon: CheckCircle },
];

export function LoadingState() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = statusMessages[currentMessageIndex].icon;

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-12">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-8"
      >
        <Brain className="h-20 w-20 text-accent" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <CurrentIcon className="h-5 w-5 text-muted-foreground" />
          <p className="text-xl text-foreground">
            {statusMessages[currentMessageIndex].text}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: i === currentMessageIndex ? 1 : 0.3,
              scale: i === currentMessageIndex ? 1.2 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="h-2 w-2 rounded-full bg-accent"
          />
        ))}
      </div>

      <div className="mt-8 w-full max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 12,
              ease: "linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
