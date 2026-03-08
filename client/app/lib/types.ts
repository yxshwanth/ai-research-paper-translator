export interface AnalysisResult {
  summary: string;
  keyContributions: string[];
  concepts: { term: string; explanation: string }[];
  eli12: string;
  quizQuestions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export type UploadState = "idle" | "uploading" | "processing" | "complete";
