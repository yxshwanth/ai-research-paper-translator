import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult, UserLevel } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

/** Extract and parse JSON from Gemini response (handles markdown fences and trailing junk). */
function parseGeminiJson(response: string): Record<string, unknown> {
  let cleaned = response
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Retry after removing trailing commas before ] or } (common LLM mistake)
    const fixed = cleaned.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Gemini] Invalid JSON snippet:", cleaned.slice(0, 500));
      }
      throw new Error(
        "Gemini returned invalid JSON. The response may have been blocked or malformed."
      );
    }
  }
}

const LEVEL_INSTRUCTIONS: Record<
  UserLevel,
  { summary: string; concepts: string; eli12: string; quiz: string }
> = {
  beginner: {
    summary:
      "Use minimal jargon. Explain technical terms in parentheses when first used. Focus on the big picture and why it matters.",
    concepts:
      "Explain each term in plain language first, then add one technical detail. Avoid formulas unless essential; if used, explain in words.",
    eli12:
      "Use simple analogies and everyday examples. Avoid acronyms or spell them out.",
    quiz:
      "Prefer easier questions: definitions, main ideas, true/false. Include at least 2 true/false and 1–2 fill-in-the-blank. difficulty: mostly 'easy', some 'medium'.",
  },
  intermediate: {
    summary:
      "Use standard domain terminology. Include methodology and key results with moderate technical depth.",
    concepts:
      "Balance plain language with technical accuracy. Include key formulas in plain text where relevant.",
    eli12:
      "Explain like to a motivated high-schooler: analogies plus some real terms.",
    quiz:
      "Mix difficulty: easy, medium, and 1–2 hard. Include 1–2 true/false, 1 fill-in-the-blank, rest multiple choice.",
  },
  expert: {
    summary:
      "Full technical depth: methodology, algorithms, metrics, benchmarks. Use domain-specific terminology.",
    concepts:
      "Formal definitions, how it works in this paper, formulas/equations in plain text. Explain relationships between concepts.",
    eli12:
      "Still accessible but can reference technical concepts; use concise analogies.",
    quiz:
      "Technical depth: more 'medium' and 'hard'. Include at least 1 fill-in-the-blank. Mix multiple choice, true/false, fillInBlank. difficulty per question.",
  },
};

function buildAnalysisPrompt(text: string, level: UserLevel): string {
  const li = LEVEL_INSTRUCTIONS[level];
  return `You are an expert academic tutor and research analyst. Analyze the following research paper and return a JSON object with exactly this structure (no extra fields at top level):

{
  "summary": "...",
  "keyContributions": ["...", "..."],
  "concepts": [{"term": "...", "explanation": "..."}],
  "eli12": "...",
  "quizQuestions": [ ... ],
  "citations": [{"raw": "optional original text", "apa": "...", "mla": "..."}]
}

**Audience level**: ${level}. ${li.summary}

**summary** (4-7 sentences): State the research problem, significance, methodology/key algorithms, concrete results (metrics, benchmarks), main innovation. ${li.summary}

**keyContributions**: 3-6 items describing what the paper introduces.

**concepts** (6-10 terms): For each: term and explanation. ${li.concepts}

**eli12**: Explain the paper in accessible terms. ${li.eli12}

**quizQuestions**: 5-7 questions. ${li.quiz}

Each quiz question must have exactly one of these shapes:

1. Multiple choice: { "type": "multipleChoice", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "...", "difficulty": "easy"|"medium"|"hard" }
2. True/False: { "type": "trueFalse", "statement": "...", "correct": true|false, "explanation": "...", "difficulty": "easy"|"medium"|"hard" }
3. Fill-in: { "type": "fillInBlank", "question": "Sentence with _____ for blank", "answer": "exact answer", "explanation": "...", "difficulty": "easy"|"medium"|"hard" }

**citations**: Extract all references/bibliography entries from the paper. For each: provide "apa" and "mla" formatted strings. Optionally "raw" with the original snippet. If no references found, use [].

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Research Paper:
${text}`;
}

export async function analyzeResearchPaper(
  text: string,
  level: UserLevel = "intermediate"
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });

  const prompt = buildAnalysisPrompt(text, level);
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  if (!response) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = parseGeminiJson(response);

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

  // Normalize quiz questions to typed shape (and support legacy format)
  const quizQuestions = (data.quizQuestions as Record<string, unknown>[]).map(
    (q) => {
      const normalized = {
        ...q,
        type: q.type ?? "multipleChoice",
        question: q.question ?? "",
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: Number(q.correctAnswer) ?? 0,
        explanation: q.explanation ?? "",
        difficulty: q.difficulty ?? "medium",
      };
      if (normalized.type === "trueFalse") {
        return {
          type: "trueFalse" as const,
          statement: String(q.statement ?? ""),
          correct: Boolean(q.correct),
          explanation: String(q.explanation ?? ""),
          difficulty: (q.difficulty as "easy" | "medium" | "hard") ?? "medium",
        };
      }
      if (normalized.type === "fillInBlank") {
        return {
          type: "fillInBlank" as const,
          question: String(q.question ?? ""),
          answer: String(q.answer ?? ""),
          explanation: String(q.explanation ?? ""),
          difficulty: (q.difficulty as "easy" | "medium" | "hard") ?? "medium",
        };
      }
      return {
        type: "multipleChoice" as const,
        question: String(q.question ?? ""),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correctAnswer: Number(q.correctAnswer) ?? 0,
        explanation: String(q.explanation ?? ""),
        difficulty: (q.difficulty as "easy" | "medium" | "hard") ?? "medium",
      };
    }
  );

  const citations = Array.isArray(data.citations)
    ? (data.citations as { raw?: string; apa?: string; mla?: string }[]).map(
        (c) => ({
          raw: c.raw,
          apa: String(c.apa ?? ""),
          mla: String(c.mla ?? ""),
        })
      )
    : undefined;

  return {
    summary: String(data.summary),
    keyContributions: (data.keyContributions as string[]).map(String),
    concepts: (data.concepts as { term: string; explanation: string }[]).map(
      (c) => ({ term: String(c.term), explanation: String(c.explanation) })
    ),
    eli12: String(data.eli12),
    quizQuestions,
    citations: citations?.length ? citations : undefined,
  };
}

const MAX_PAPER_CHARS = 120000; // ~30k tokens rough

export async function askAboutPaper(
  paperText: string,
  analysis: { summary: string; keyContributions: string[]; concepts: { term: string; explanation: string }[]; eli12: string },
  question: string,
  history?: { role: "user" | "model"; content: string }[]
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  const truncatedPaper =
    paperText.length > MAX_PAPER_CHARS
      ? paperText.slice(0, MAX_PAPER_CHARS) + "\n\n[Paper truncated for length.]"
      : paperText;

  const context = `## Paper excerpt (for context)\n${truncatedPaper}\n\n## Summary\n${analysis.summary}\n\n## Key contributions\n${analysis.keyContributions.join("\n")}\n\n## Concepts (selected)\n${analysis.concepts.slice(0, 15).map((c) => `- ${c.term}: ${c.explanation.slice(0, 200)}...`).join("\n")}\n\n## ELI12\n${analysis.eli12}`;

  let prompt = `You are a helpful tutor. Answer the user's question based ONLY on the paper and analysis below. Be concise and accurate. If the answer is not in the context, say so.\n\n${context}\n\n`;

  if (history?.length) {
    for (const msg of history.slice(-10)) {
      prompt += msg.role === "user" ? `User: ${msg.content}\n\n` : `Assistant: ${msg.content}\n\n`;
    }
  }

  prompt += `User: ${question}\n\nAssistant:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text?.trim() ?? "I couldn't generate a response.";
}
