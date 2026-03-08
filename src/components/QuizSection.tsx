"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface QuizSectionProps {
  quizQuestions: AnalysisResult["quizQuestions"];
}

export function QuizSection({ quizQuestions }: QuizSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = quizQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    setShowExplanation(true);

    if (index === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const getMessage = () => {
      if (percentage === 100) return "Perfect! You're a master! 🎉";
      if (percentage >= 80) return "Great job! You really understood this! 🌟";
      if (percentage >= 60) return "Good work! Keep learning! 📚";
      return "Nice try! Review the material and try again! 💪";
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-accent/10 p-12 text-center"
      >
        <Trophy className="h-20 w-20 text-accent mb-6" />
        <h3 className="text-3xl font-heading text-foreground mb-4">
          Quiz Complete!
        </h3>
        <div className="mb-6">
          <p className="text-5xl font-heading text-accent mb-2">
            {score}/{quizQuestions.length}
          </p>
          <p className="text-xl text-foreground/80">{getMessage()}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRetake}
          className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RotateCcw className="h-5 w-5" />
          Retake Quiz
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {quizQuestions.length}
        </p>
        <p className="text-sm text-muted-foreground">
          Score: {score}/{quizQuestions.length}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-xl text-foreground">{question.question}</h3>
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              const showCorrect = selectedAnswer !== null && isCorrectAnswer;
              const showIncorrect = isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                  whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={`
                    relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all
                    ${
                      showCorrect
                        ? "border-green-500 bg-green-50"
                        : showIncorrect
                        ? "border-red-500 bg-red-50"
                        : isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border bg-card hover:border-accent/50 hover:bg-muted/30"
                    }
                    ${selectedAnswer !== null ? "cursor-default" : "cursor-pointer"}
                  `}
                >
                  <div
                    className={`
                    flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors
                    ${
                      showCorrect
                        ? "border-green-500 bg-green-500"
                        : showIncorrect
                        ? "border-red-500 bg-red-500"
                        : isSelected
                        ? "border-accent bg-accent"
                        : "border-muted-foreground/30"
                    }
                  `}
                  >
                    {showCorrect ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : showIncorrect ? (
                      <XCircle className="h-5 w-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm ${
                          isSelected ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`flex-1 ${
                      showCorrect
                        ? "text-green-900"
                        : showIncorrect
                        ? "text-red-900"
                        : "text-foreground"
                    }`}
                  >
                    {option}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden rounded-xl border p-4 ${
                  isCorrect
                    ? "border-green-500/50 bg-green-50"
                    : "border-red-500/50 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`mb-2 font-medium ${
                        isCorrect ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {isCorrect ? "Correct!" : "Not quite right"}
                    </p>
                    <p
                      className={`text-sm leading-relaxed ${
                        isCorrect ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          {selectedAnswer !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {currentQuestion < quizQuestions.length - 1
                ? "Next Question"
                : "Finish Quiz"}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
