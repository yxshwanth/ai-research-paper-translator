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
      maxOutputTokens: 8192,
    },
  });

  const prompt = `You are an expert academic tutor and research analyst. Analyze the following research paper and return a JSON object with exactly this structure: { "summary": "...", "keyContributions": ["..."], "concepts": [{"term": "...", "explanation": "..."}], "eli12": "...", "quizQuestions": [{"question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..."}] }

Rules:

**summary** (technical, 4-7 sentences):
- State the research problem and its significance
- Describe the methodology, architecture, or key algorithms used (use proper technical terms)
- Include concrete results: metrics (accuracy, F1, latency, etc.), benchmarks, or quantitative findings
- Mention the main technical innovation or contribution
- Use domain-appropriate terminology (e.g., transformers, attention, loss functions, optimization)

**keyContributions**: 3-6 items describing what the paper introduces (technical phrasing)

**concepts** (6-10 terms, technically detailed):
- For each term: 2-4 sentence explanation with real technical depth
- Include: formal definition, how it works in this paper, formulas/equations when relevant (use plain text, e.g. "softmax(x_i) = exp(x_i) / sum(exp(x_j))")
- Cover core algorithms, architectures, loss functions, evaluation metrics, and domain-specific techniques from the paper
- Explain relationships between concepts when they interact in the paper

**eli12**: explain the paper as if talking to a 12-year-old, use fun analogies (keep this accessible)

**quizQuestions**: exactly 5 multiple choice questions, 4 options each, correctAnswer is zero-indexed (can test technical understanding)

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
