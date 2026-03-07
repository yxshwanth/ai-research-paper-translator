"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AnalysisResult } from "@/lib/types";

interface QuizSectionProps {
  quizQuestions: AnalysisResult["quizQuestions"];
}

export function QuizSection({ quizQuestions }: QuizSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const question = quizQuestions[currentIndex];
  const isLastQuestion = currentIndex === quizQuestions.length - 1;

  const handleSelect = (optionIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(optionIndex);
    if (optionIndex === question.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    let message = "Great job!";
    if (percentage === 100) message = "Perfect score! 🎉";
    else if (percentage >= 80) message = "Excellent work!";
    else if (percentage >= 60) message = "Good effort!";
    else message = "Keep studying!";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="border-[#e8e4dc] bg-[#FAFAF7] overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center">
            <h3 className="font-heading text-2xl text-[#1a2332] mb-2">
              Quiz Complete!
            </h3>
            <p className="text-4xl font-bold text-[#1a2332] mb-2">
              {score}/{quizQuestions.length}
            </p>
            <p className="text-[#1a2332]/70 mb-6">{message}</p>
            <Button
              onClick={handleRetake}
              variant="outline"
              className="border-[#1a2332] text-[#1a2332] hover:bg-[#1a2332]/5"
            >
              Retake Quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#1a2332]/70">
          Question {currentIndex + 1} of {quizQuestions.length}
        </span>
        <Progress
          value={((currentIndex + 1) / quizQuestions.length) * 100}
          className="w-32 h-2"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <Card className="border-[#e8e4dc] bg-white">
            <CardContent className="pt-6">
              <p className="text-lg font-medium text-[#1a2332] mb-6">
                {question.question}
              </p>
              <div className="grid gap-3">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const isCorrect = optionIndex === question.correctAnswer;
                  const showResult = selectedAnswer !== null;

                  let borderClass = "border-[#e8e4dc] hover:border-[#1a2332]/30";
                  if (showResult) {
                    if (isCorrect) borderClass = "border-green-500 bg-green-50";
                    else if (isSelected && !isCorrect)
                      borderClass = "border-red-500 bg-red-50";
                  }

                  return (
                    <motion.button
                      key={optionIndex}
                      onClick={() => handleSelect(optionIndex)}
                      disabled={selectedAnswer !== null}
                      whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                      whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all
                        ${borderClass}
                      `}
                    >
                      <span className="font-medium text-[#1a2332]">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 rounded-lg bg-[#1a2332]/5 border border-[#1a2332]/10"
                >
                  <p className="text-sm text-[#1a2332]/80">{question.explanation}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {selectedAnswer !== null && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-[#1a2332] hover:bg-[#1a2332]/90"
              >
                {isLastQuestion ? "See Results" : "Next Question"}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
