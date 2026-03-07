import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Use gemini-2.5-flash-lite by default. Override with GEMINI_MODEL env var.
const MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

export async function analyzeResearchPaper(
  text: string
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });

  const prompt = `You are an expert academic tutor. Analyze the following research paper and return a JSON object with exactly this structure: { "summary": "...", "keyContributions": ["..."], "concepts": [{"term": "...", "explanation": "..."}], "eli12": "...", "quizQuestions": [{"question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..."}] }

Rules:
- summary: 3-5 sentences, no jargon, plain language
- keyContributions: 3-6 items describing what the paper introduces
- concepts: 5-8 technical terms with simple one-sentence explanations
- eli12: explain the paper as if talking to a 12-year-old, use fun analogies
- quizQuestions: exactly 5 multiple choice questions, 4 options each, correctAnswer is zero-indexed

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Research Paper:
${text}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  if (!response) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: unknown;
  try {
    const cleaned = response.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Gemini returned invalid JSON. The response may have been blocked or malformed."
    );
  }

  const data = parsed as Record<string, unknown>;
  if (
    !data.summary ||
    !Array.isArray(data.keyContributions) ||
    !Array.isArray(data.concepts) ||
    !data.eli12 ||
    !Array.isArray(data.quizQuestions)
  ) {
    throw new Error(
      "Gemini response is missing required fields: summary, keyContributions, concepts, eli12, or quizQuestions."
    );
  }

  return parsed as AnalysisResult;
}
