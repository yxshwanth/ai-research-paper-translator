export type UserLevel = "beginner" | "intermediate" | "expert";

/** Structured citation fields extracted by Gemini; APA/MLA formatted in code. */
export interface CitationFields {
  authors: string[];
  title: string;
  year?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  doi?: string;
}

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
  /** Argument spine node indices (0-based) this question relates to */
  relatedSpineIndices?: number[];
}

export interface TrueFalseQuestion {
  type: "trueFalse";
  statement: string;
  correct: boolean;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
  relatedSpineIndices?: number[];
}

export interface FillInBlankQuestion {
  type: "fillInBlank";
  question: string; // e.g. "The _____ layer normalizes inputs."
  answer: string;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
  relatedSpineIndices?: number[];
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FillInBlankQuestion;

/** Role of a step in the paper's argument chain. */
export type ArgumentSpineRole =
  | "problem"
  | "gap"
  | "hypothesis"
  | "method"
  | "evidence"
  | "conclusion"
  | "limitation"
  | "implication";

export interface ArgumentSpineNode {
  claim: string;
  role: ArgumentSpineRole;
  connectionToNext: string;
  connectionStrength: "strong" | "moderate" | "weak";
  strengthJustification: string;
  relevantConceptIndices: number[];
  supportingExcerpt?: string;
  whyThisStepMatters?: string;
  comprehensionQuestion: string;
}

/** Legacy format (no type field) is treated as multipleChoice. */
export function normalizeQuizQuestion(
  q: Record<string, unknown>
): QuizQuestion {
  const relatedSpineIndices = Array.isArray(q.relatedSpineIndices)
    ? (q.relatedSpineIndices as number[]).filter((n) => typeof n === "number" && n >= 0)
    : undefined;
  if (q.type === "trueFalse") {
    return {
      type: "trueFalse",
      statement: String(q.statement ?? ""),
      correct: Boolean(q.correct),
      explanation: String(q.explanation ?? ""),
      difficulty: q.difficulty as "easy" | "medium" | "hard" | undefined,
      relatedSpineIndices,
    };
  }
  if (q.type === "fillInBlank") {
    return {
      type: "fillInBlank",
      question: String(q.question ?? ""),
      answer: String(q.answer ?? ""),
      explanation: String(q.explanation ?? ""),
      difficulty: q.difficulty as "easy" | "medium" | "hard" | undefined,
      relatedSpineIndices,
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
    relatedSpineIndices,
  };
}

export interface AnalysisResult {
  summary: string;
  keyContributions: string[];
  concepts: { term: string; explanation: string }[];
  eli12: string;
  quizQuestions: QuizQuestion[];
  citations?: CitationEntry[];
  /** Domain (e.g. CS/ML, medicine, social science) and type (empirical, survey, theoretical) */
  paperDomain?: string;
  paperType?: string;
  /** 3 suggested follow-up questions for the Ask section */
  suggestedQuestions?: string[];
  /** One sentence for Ask tab context, e.g. "This paper uses [methodology] to study [topic]." */
  topicOrMethodLine?: string;
  /** Explicit mapping of analogy parts to paper components (for ELI12) */
  eli12Mapping?: string;
  /** 1-5 confidence in analysis quality (figures, equations, completeness) */
  analysisConfidence?: number;
  /** Warning when PDF parse quality is poor */
  parseQualityWarning?: string;
  /** Logical argument chain (5–8 steps); first tab when present */
  argumentSpine?: ArgumentSpineNode[];
  /** Per-spine fragility analysis; fetched on demand */
  vulnerabilityMap?: VulnerabilityMap;
  /** Methodology transfer suggestions; fetched on demand */
  methodologyTransfer?: MethodologyTransferSuggestion[];
}

export interface AnalyzeResponse extends AnalysisResult {
  slug?: string;
  /** Raw text extracted from PDF (for debugging/trust) */
  extractedText?: string;
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
  /** One suggested follow-up question based on the conversation */
  suggestedFollowUp?: string;
}

// Vulnerability Map ("What Would Break This?")
export interface VulnerabilityNode {
  spineIndex: number;
  fragilityScore: 1 | 2 | 3 | 4 | 5; // 1=robust, 5=very fragile
  assumptionsThatWouldCollapse: string[];
  dataThatWouldContradict?: string;
  alternativeExplanationsNotAddressed?: string;
}

export interface VulnerabilityMap {
  nodes: VulnerabilityNode[];
}

// Methodology Transfer
export interface MethodologyTransferSuggestion {
  targetDomain: string;
  adaptationSteps: string[];
  keyConsiderations: string;
}

// Cross-Paper Comparison
export interface ContradictionPoint {
  type: "conclusion" | "methodology" | "assumption" | "citation_interpretation";
  description: string;
  paperSlugs: string[];
  spineIndicesBySlug?: Record<string, number[]>;
}

export interface SpineDivergence {
  role: ArgumentSpineRole;
  papersByClaim: Record<string, string>;
  divergenceNote?: string;
}

export interface CrossPaperComparison {
  contradictions: ContradictionPoint[];
  spineDivergence: SpineDivergence[];
  sharedCitationsInterpretation?: string;
}
