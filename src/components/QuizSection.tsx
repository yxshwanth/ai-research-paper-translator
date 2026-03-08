"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, RotateCcw, Trophy, History } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import type { ArgumentSpineNode } from "@/lib/types";
import { normalizeQuizQuestion } from "@/lib/types";

const ROLE_LABELS: Record<ArgumentSpineNode["role"], string> = {
  problem: "Problem",
  gap: "Gap",
  hypothesis: "Hypothesis",
  method: "Method",
  evidence: "Evidence",
  conclusion: "Conclusion",
  limitation: "Limitation",
  implication: "Implication",
};

interface QuizSectionProps {
  quizQuestions: AnalysisResult["quizQuestions"];
  slug?: string;
  argumentSpine?: ArgumentSpineNode[];
}

interface AnswerRecord {
  questionIndex: number;
  selectedAnswer: number | boolean | string;
  correct: boolean;
}

export function QuizSection({ quizQuestions, slug, argumentSpine }: QuizSectionProps) {
  const normalized = useMemo(
    () =>
      quizQuestions.map((q) =>
        normalizeQuizQuestion(q as unknown as Record<string, unknown>)
      ),
    [quizQuestions]
  );

  const [compactMode, setCompactMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | string | null>(null);
  const [fillInValue, setFillInValue] = useState("");
  const [fillInByIndex, setFillInByIndex] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [compactAnswers, setCompactAnswers] = useState<Record<number, { selectedAnswer: number | boolean | string; correct: boolean }>>({});
  const [lastAttempt, setLastAttempt] = useState<{ score: number; total: number; createdAt: string } | null>(null);
  const [cardFlash, setCardFlash] = useState<"correct" | "incorrect" | null>(null);

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
    const correct =
      question.type === "multipleChoice"
        ? value === question.correctAnswer
        : question.type === "trueFalse"
          ? value === question.correct
          : String(value).trim().toLowerCase() === question.answer.trim().toLowerCase();
    setCardFlash(correct ? "correct" : "incorrect");
    setTimeout(() => setCardFlash(null), 300);
    setSelectedAnswer(value);
    setShowExplanation(true);
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

  const handleCompactAnswer = (questionIndex: number, value: number | boolean | string) => {
    const q = normalized[questionIndex];
    const correct =
      q.type === "multipleChoice"
        ? value === q.correctAnswer
        : q.type === "trueFalse"
          ? value === q.correct
          : String(value).trim().toLowerCase() === q.answer.trim().toLowerCase();
    setCompactAnswers((prev) => {
      const next = { ...prev, [questionIndex]: { selectedAnswer: value, correct } };
      if (Object.keys(next).length === normalized.length && slug) {
        const total = normalized.length;
        const finalScore = Object.values(next).filter((r) => r.correct).length;
        const finalAnswers: AnswerRecord[] = Object.entries(next).map(([idx, r]) => ({
          questionIndex: Number(idx),
          selectedAnswer: r.selectedAnswer,
          correct: r.correct,
        }));
        fetch(`/api/analyses/${slug}/quiz-attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ score: finalScore, total, answers: finalAnswers }),
        })
          .then((res) => res.ok ? fetch(`/api/analyses/${slug}/quiz-history`, { credentials: "include" }) : null)
          .then((res) => (res?.ok ? res.json() : null))
          .then((data) => data?.lastAttempt && setLastAttempt(data.lastAttempt))
          .catch(() => {});
        setQuizComplete(true);
      }
      return next;
    });
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setFillInValue("");
    setFillInByIndex({});
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
    setCompactAnswers({});
  };

  function getTargetedCompletionMessage(
    finalAnswers: AnswerRecord[],
    total: number
  ): string {
    const missed = finalAnswers.filter((a) => !a.correct);
    if (missed.length === 0) return "Perfect! You're a master!";
    if (!argumentSpine?.length) return "Review the Argument Spine for the topics you missed.";
    const spineIndices = new Set<number>();
    for (const a of missed) {
      const q = normalized[a.questionIndex];
      const indices = "relatedSpineIndices" in q && Array.isArray(q.relatedSpineIndices) ? q.relatedSpineIndices : [];
      indices.forEach((i: number) => spineIndices.add(i));
    }
    if (spineIndices.size === 0) return "Review the Argument Spine for the topics you missed.";
    const roles = [...spineIndices]
      .filter((i) => i >= 0 && i < argumentSpine.length)
      .map((i) => ROLE_LABELS[argumentSpine[i].role]);
    const uniqueRoles = [...new Set(roles)];
    if (uniqueRoles.length === 0) return "Review the Argument Spine for the topics you missed.";
    return `You missed questions about the ${uniqueRoles.join(" and ")} steps. Review those nodes in the Argument Spine.`;
  }

  if (quizComplete) {
    const total = normalized.length;
    const finalAnswers: AnswerRecord[] = compactMode
      ? Object.entries(compactAnswers)
          .map(([questionIndex, { selectedAnswer: selectedAnswerVal, correct }]) => ({
            questionIndex: Number(questionIndex),
            selectedAnswer: selectedAnswerVal,
            correct,
          }))
          .sort((a, b) => a.questionIndex - b.questionIndex)
      : answers.length >= total
        ? answers
        : [
            ...answers,
            {
              questionIndex: currentQuestion,
              selectedAnswer: selectedAnswer!,
              correct: isCorrect,
            },
          ];
    const totalScore = finalAnswers.filter((a) => a.correct).length;
    const percentage = Math.round((totalScore / total) * 100);
    const completionMessage =
      percentage < 100 && (finalAnswers.some((a) => !a.correct))
        ? getTargetedCompletionMessage(finalAnswers, total)
        : percentage === 100
          ? "Perfect! You're a master!"
          : percentage >= 80
            ? "Great job! You really understood this!"
            : percentage >= 60
              ? "Good work! Keep learning!"
              : "Nice try! Review the material and try again!";

    const formatAnswer = (q: (typeof normalized)[0], ans: number | boolean | string) => {
      if (q.type === "multipleChoice")
        return q.options[typeof ans === "number" ? ans : 0] ?? String(ans);
      if (q.type === "trueFalse") return ans ? "True" : "False";
      return String(ans);
    };

    const getCorrectAnswer = (q: (typeof normalized)[0]) => {
      if (q.type === "multipleChoice") return q.options[q.correctAnswer];
      if (q.type === "trueFalse") return q.correct ? "True" : "False";
      return q.answer;
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col items-center rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-accent/10 p-8 text-center">
          <Trophy className="h-16 w-16 text-accent mb-4" />
          <h3 className="text-2xl font-heading text-foreground mb-2">
            Quiz Complete!
          </h3>
          <p className="text-4xl font-heading text-accent mb-2">
            {totalScore}/{total}
          </p>
          <p className="text-foreground/80 mb-4">{completionMessage}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetake}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </motion.button>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-foreground">Review</h4>
          {finalAnswers.map((a, i) => {
            const q = normalized[a.questionIndex];
            const userAns = formatAnswer(q, a.selectedAnswer);
            const correctAns = getCorrectAnswer(q);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-4 ${
                  a.correct ? "border-green-500/50 bg-green-50/50" : "border-red-500/50 bg-red-50/50"
                }`}
              >
                <p className="font-medium text-foreground mb-2">
                  {q.type === "multipleChoice" ? q.question : q.type === "trueFalse" ? q.statement : q.question}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  Your answer: <span className={a.correct ? "text-green-700" : "text-red-700"}>{userAns}</span>
                </p>
                {!a.correct && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Correct answer: <span className="text-green-700">{correctAns}</span>
                  </p>
                )}
                <p className="text-sm text-foreground/90">{q.explanation}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const answeredCount = Object.keys(compactAnswers).length;

  if (compactMode && !quizComplete) {
    return (
      <div className="space-y-6">
        {lastAttempt && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>Last time: {lastAttempt.score}/{lastAttempt.total}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Mode:</span>
          <button
            type="button"
            onClick={() => setCompactMode(false)}
            className="rounded-lg border-2 border-accent bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent"
          >
            All questions
          </button>
          <button
            type="button"
            onClick={() => setCompactMode(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            Step-by-step
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {answeredCount}/{normalized.length} answered
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${(answeredCount / normalized.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {normalized.map((q, index) => {
            const record = compactAnswers[index];
            const isAnswered = record != null;
            return (
              <motion.div
                key={index}
                layout
                className={`rounded-xl border-2 border-border bg-card p-6 ${
                  isAnswered
                    ? record.correct
                      ? "border-green-500/50 bg-green-50/30"
                      : "border-red-500/50 bg-red-50/30"
                    : ""
                }`}
              >
                <h3 className="text-lg font-medium text-foreground mb-4">
                  {q.type === "multipleChoice" ? q.question : q.type === "trueFalse" ? q.statement : q.question}
                </h3>
                {!isAnswered && q.type === "multipleChoice" && (
                  <div className="grid gap-2">
                    {q.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleCompactAnswer(index, i)}
                        className="rounded-lg border-2 border-border p-3 text-left hover:border-accent/50 hover:bg-muted/30"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {!isAnswered && q.type === "trueFalse" && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleCompactAnswer(index, false)}
                      className="rounded-lg border-2 border-border px-4 py-2 hover:border-accent/50"
                    >
                      False
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompactAnswer(index, true)}
                      className="rounded-lg border-2 border-border px-4 py-2 hover:border-accent/50"
                    >
                      True
                    </button>
                  </div>
                )}
                {!isAnswered && q.type === "fillInBlank" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fillInByIndex[index] ?? ""}
                      onChange={(e) =>
                        setFillInByIndex((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      placeholder="Type your answer..."
                      className="flex-1 rounded-lg border-2 border-border px-3 py-2 focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = fillInByIndex[index] ?? "";
                        if (val.trim()) handleCompactAnswer(index, val);
                      }}
                      disabled={!(fillInByIndex[index] ?? "").trim()}
                      className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                    >
                      Check
                    </button>
                  </div>
                )}
                {isAnswered && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {record.correct ? (
                        <span className="text-green-700">Correct.</span>
                      ) : (
                        <span className="text-red-700">Incorrect.</span>
                      )}
                    </p>
                    <p className="text-sm text-foreground/90">{q.explanation}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
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

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">Mode:</span>
        <button
          type="button"
          onClick={() => setCompactMode(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          All questions
        </button>
        <button
          type="button"
          onClick={() => setCompactMode(true)}
          className="rounded-lg border-2 border-accent bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent"
        >
          Step-by-step
        </button>
      </div>

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
          <motion.div
            className="rounded-xl border border-border bg-card p-6"
            animate={{
              backgroundColor:
                cardFlash === "correct"
                  ? "rgba(34, 197, 94, 0.15)"
                  : cardFlash === "incorrect"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "var(--card)",
            }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl text-foreground">
              {question.type === "multipleChoice"
                ? question.question
                : question.type === "trueFalse"
                  ? question.statement
                  : question.question}
            </h3>
          </motion.div>

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
