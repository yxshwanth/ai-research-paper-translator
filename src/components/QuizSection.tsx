"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, RotateCcw, Trophy, History } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { normalizeQuizQuestion } from "@/lib/types";

interface QuizSectionProps {
  quizQuestions: AnalysisResult["quizQuestions"];
  slug?: string;
}

interface AnswerRecord {
  questionIndex: number;
  selectedAnswer: number | boolean | string;
  correct: boolean;
}

export function QuizSection({ quizQuestions, slug }: QuizSectionProps) {
  const normalized = useMemo(
    () =>
      quizQuestions.map((q) =>
        normalizeQuizQuestion(q as unknown as Record<string, unknown>)
      ),
    [quizQuestions]
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | string | null>(null);
  const [fillInValue, setFillInValue] = useState("");
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastAttempt, setLastAttempt] = useState<{ score: number; total: number; createdAt: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/analyses/${slug}/quiz-history`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.lastAttempt && setLastAttempt(data.lastAttempt))
      .catch(() => {});
  }, [slug]);

  const question = normalized[currentQuestion];
  const isCorrect = (() => {
    if (question.type === "multipleChoice")
      return selectedAnswer === question.correctAnswer;
    if (question.type === "trueFalse")
      return selectedAnswer === question.correct;
    if (question.type === "fillInBlank")
      return (
        selectedAnswer !== null &&
        String(selectedAnswer).trim().toLowerCase() ===
          question.answer.trim().toLowerCase()
      );
    return false;
  })();

  const handleAnswerSelect = (value: number | boolean | string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(value);
    setShowExplanation(true);
    const correct =
      question.type === "multipleChoice"
        ? value === question.correctAnswer
        : question.type === "trueFalse"
          ? value === question.correct
          : String(value).trim().toLowerCase() === question.answer.trim().toLowerCase();
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [
      ...a,
      {
        questionIndex: currentQuestion,
        selectedAnswer: value,
        correct,
      },
    ]);
  };

  const handleNext = () => {
    if (currentQuestion < normalized.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setFillInValue("");
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      if (slug && selectedAnswer !== null) {
        const total = normalized.length;
        const finalScore = score + (isCorrect ? 1 : 0);
        const finalAnswers: AnswerRecord[] =
          answers.length === currentQuestion
            ? [
                ...answers,
                {
                  questionIndex: currentQuestion,
                  selectedAnswer,
                  correct: isCorrect,
                },
              ]
            : answers;
        fetch(`/api/analyses/${slug}/quiz-attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            score: finalScore,
            total,
            answers: finalAnswers,
          }),
        })
          .then((res) =>
            res.ok
              ? fetch(`/api/analyses/${slug}/quiz-history`, {
                  credentials: "include",
                })
              : null
          )
          .then((res) => (res?.ok ? res.json() : null))
          .then((data) => data?.lastAttempt && setLastAttempt(data.lastAttempt))
          .catch(() => {});
      }
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setFillInValue("");
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
  };

  if (quizComplete) {
    const total = normalized.length;
    const totalScore =
      answers.length >= total
        ? answers.filter((a) => a.correct).length
        : score + (selectedAnswer !== null && isCorrect ? 1 : 0);
    const percentage = Math.round((totalScore / total) * 100);
    const getMessage = () => {
      if (percentage === 100) return "Perfect! You're a master!";
      if (percentage >= 80) return "Great job! You really understood this!";
      if (percentage >= 60) return "Good work! Keep learning!";
      return "Nice try! Review the material and try again!";
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
            {totalScore}/{total}
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
      {lastAttempt && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
          <History className="h-4 w-4" />
          <span>
            Last time: {lastAttempt.score}/{lastAttempt.total}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {normalized.length}
        </p>
        <p className="text-sm text-muted-foreground">
          Score: {score}/{normalized.length}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-accent"
          initial={false}
          animate={{
            width: `${((currentQuestion + 1) / normalized.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

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
            <h3 className="text-xl text-foreground">
              {question.type === "multipleChoice"
                ? question.question
                : question.type === "trueFalse"
                  ? question.statement
                  : question.question}
            </h3>
          </div>

          {question.type === "multipleChoice" && (
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
                    className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      showCorrect
                        ? "border-green-500 bg-green-50"
                        : showIncorrect
                          ? "border-red-500 bg-red-50"
                          : isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border bg-card hover:border-accent/50 hover:bg-muted/30"
                    } ${selectedAnswer !== null ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        showCorrect
                          ? "border-green-500 bg-green-500"
                          : showIncorrect
                            ? "border-red-500 bg-red-500"
                            : isSelected
                              ? "border-accent bg-accent"
                              : "border-muted-foreground/30"
                      }`}
                    >
                      {showCorrect ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : showIncorrect ? (
                        <XCircle className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm ${isSelected ? "text-white" : "text-muted-foreground"}`}
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
          )}

          {question.type === "trueFalse" && (
            <div className="grid grid-cols-2 gap-3">
              {([false, true] as const).map((value) => {
                const isSelected = selectedAnswer === value;
                const correct = value === question.correct;
                const showCorrect = selectedAnswer !== null && correct;
                const showIncorrect = isSelected && !correct;
                return (
                  <motion.button
                    key={String(value)}
                    whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                    whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswerSelect(value)}
                    disabled={selectedAnswer !== null}
                    className={`rounded-xl border-2 p-4 text-lg font-medium transition-all ${
                      showCorrect
                        ? "border-green-500 bg-green-50 text-green-900"
                        : showIncorrect
                          ? "border-red-500 bg-red-50 text-red-900"
                          : isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border bg-card hover:border-accent/50"
                    }`}
                  >
                    {value ? "True" : "False"}
                  </motion.button>
                );
              })}
            </div>
          )}

          {question.type === "fillInBlank" && (
            <div className="space-y-3">
              <input
                type="text"
                value={fillInValue}
                onChange={(e) => setFillInValue(e.target.value)}
                disabled={selectedAnswer !== null}
                placeholder="Type your answer..."
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => handleAnswerSelect(fillInValue)}
                disabled={selectedAnswer !== null || !fillInValue.trim()}
                className="rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Check answer
              </button>
            </div>
          )}

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
                      className={`mb-2 font-medium ${isCorrect ? "text-green-900" : "text-red-900"}`}
                    >
                      {isCorrect ? "Correct!" : "Not quite right"}
                    </p>
                    <p
                      className={`text-sm leading-relaxed ${isCorrect ? "text-green-800" : "text-red-800"}`}
                    >
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedAnswer !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {currentQuestion < normalized.length - 1
                ? "Next Question"
                : "Finish Quiz"}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
