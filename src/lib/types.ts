export type UserLevel = "beginner" | "intermediate" | "expert";

export interface CitationEntry {
  raw?: string;
  apa: string;
  mla: string;
}

// Quiz question types for mixed quizzes
export interface MultipleChoiceQuestion {
  type: "multipleChoice";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface TrueFalseQuestion {
  type: "trueFalse";
  statement: string;
  correct: boolean;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface FillInBlankQuestion {
  type: "fillInBlank";
  question: string; // e.g. "The _____ layer normalizes inputs."
  answer: string;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FillInBlankQuestion;

/** Legacy format (no type field) is treated as multipleChoice. */
export function normalizeQuizQuestion(
  q: Record<string, unknown>
): QuizQuestion {
  if (q.type === "trueFalse") {
    return {
      type: "trueFalse",
      statement: String(q.statement ?? ""),
      correct: Boolean(q.correct),
      explanation: String(q.explanation ?? ""),
      difficulty: q.difficulty as "easy" | "medium" | "hard" | undefined,
    };
  }
  if (q.type === "fillInBlank") {
    return {
      type: "fillInBlank",
      question: String(q.question ?? ""),
      answer: String(q.answer ?? ""),
      explanation: String(q.explanation ?? ""),
      difficulty: q.difficulty as "easy" | "medium" | "hard" | undefined,
    };
  }
  // multipleChoice or legacy
  return {
    type: "multipleChoice",
    question: String(q.question ?? ""),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correctAnswer: Number(q.correctAnswer) || 0,
    explanation: String(q.explanation ?? ""),
    difficulty: q.difficulty as "easy" | "medium" | "hard" | undefined,
  };
}

export interface AnalysisResult {
  summary: string;
  keyContributions: string[];
  concepts: { term: string; explanation: string }[];
  eli12: string;
  quizQuestions: QuizQuestion[];
  citations?: CitationEntry[];
}

export interface AnalyzeResponse extends AnalysisResult {
  slug?: string;
}

export type UploadState = "idle" | "uploading" | "processing" | "complete";

// Follow-up Q&A
export interface AskRequest {
  slug: string;
  question: string;
  history?: { role: "user" | "model"; content: string }[];
}

export interface AskResponse {
  answer: string;
}
