"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STATUS_MESSAGES = [
  "Reading your paper...",
  "Extracting key ideas...",
  "Generating quiz questions...",
  "Almost done...",
];

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 800);
    return () => clearInterval(progressInterval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white border border-[#e8e4dc] shadow-lg"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="rounded-full bg-[#1a2332]/10 p-6"
        >
          <Brain className="h-16 w-16 text-[#1a2332]" strokeWidth={1.5} />
        </motion.div>

        <div className="text-center space-y-2">
          <h3 className="font-heading text-xl text-[#1a2332]">
            Analyzing your paper
          </h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-[#1a2332]/70 text-sm"
            >
              {STATUS_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            <span className="text-xs text-[#1a2332]/50">Progress</span>
            <span className="text-xs text-[#1a2332]/70">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-[#1a2332]"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
