import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";
import type {
  AnalysisResult,
  ArgumentSpineNode,
  CitationEntry,
  CitationFields,
  ContradictionPoint,
  CrossPaperComparison,
  MethodologyTransferSuggestion,
  SpineDivergence,
  UserLevel,
  VulnerabilityMap,
  VulnerabilityNode,
} from "./types";

export interface SpineCheckResult {
  understood: boolean;
  feedback: string;
}
import { formatAPA, formatMLA } from "./citations";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

const MAX_PAPER_CHARS = 120000; // ~30k tokens rough

/** Truncate middle of paper, keeping intro, conclusion, and references. */
export function truncatePaperMiddle(text: string, maxChars: number = MAX_PAPER_CHARS): string {
  if (text.length <= maxChars) return text;
  const head = Math.floor(maxChars * 0.35);
  const tail = Math.floor(maxChars * 0.45);
  const mid = maxChars - head - tail - 100; // reserve for placeholder
  const start = text.slice(0, head);
  const end = text.slice(-tail);
  return `${start}\n\n[... middle section truncated for length ...]\n\n${end}`;
}

/** Repair common truncation and typo patterns in Gemini JSON. */
function repairTruncatedJson(json: string): string {
  return json
    .replace(/("connectionStrength"\s*:\s*")stron"?/g, '$1strong"')
    .replace(/("connectionStrength"\s*:\s*")moderat"?/g, '$1moderate"')
    .replace(/("connectionStrength"\s*:\s*")wea"?/g, '$1weak"')
    .replace(/("connectionStrength"\s*:\s*")strong"[a-z]*"/g, '"connectionStrength": "strong"')
    .replace(/("connectionStrength"\s*:\s*")moderate"[a-z]*"/g, '"connectionStrength": "moderate"')
    .replace(/("connectionStrength"\s*:\s*")weak"[a-z]*"/g, '"connectionStrength": "weak"');
}

/** Attempt to close JSON truncated mid-string. Tries common suffixes. */
function tryCloseTruncatedJson(json: string): string {
  const s = json.trimEnd();
  // Common truncation points: mid-string in argumentSpine node, or mid-object
  const suffixes = ['"}]}', '"}]', '"}"}', '"}"', '"}"}]}', '"'];
  for (const suffix of suffixes) {
    try {
      const attempt = s + suffix;
      JSON.parse(attempt);
      return attempt;
    } catch {
      continue;
    }
  }
  return s;
}

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

  cleaned = repairTruncatedJson(cleaned);

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Retry after removing trailing commas before ] or } (common LLM mistake)
    let fixed = cleaned.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch {
      // Try to close truncated JSON with common suffixes
      fixed = tryCloseTruncatedJson(cleaned);
      try {
        return JSON.parse(fixed) as Record<string, unknown>;
      } catch {
        // Final fallback: use jsonrepair library to fix truncated/malformed JSON
        try {
          const repaired = jsonrepair(cleaned);
          return JSON.parse(repaired) as Record<string, unknown>;
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
  return `You are an expert academic tutor and research analyst.

**FIRST**: Identify the paper's domain (e.g., CS/ML, medicine, social science, physics, humanities) and paper type (empirical study, survey, theoretical, case study). Then adapt your analysis accordingly — a machine learning paper and a sociology paper need completely different analysis strategies.

Analyze the following research paper and return a JSON object with exactly this structure (no extra fields at top level):

{
  "paperDomain": "e.g. CS/ML, medicine, social science",
  "paperType": "e.g. empirical study, survey, theoretical",
  "argumentSpine": [ ... ],
  "summary": "...",
  "keyContributions": ["...", "..."],
  "concepts": [{"term": "...", "explanation": "..."}],
  "eli12": "...",
  "eli12Mapping": "Explicit mapping: analogy part X = paper component Y (include this after the analogy)",
  "quizQuestions": [ ... ],
  "citations": [{"authors": ["..."], "title": "...", "year": "...", "journal": "...", "volume": "...", "pages": "...", "doi": "..."}],
  "suggestedQuestions": ["question 1", "question 2", "question 3"],
  "topicOrMethodLine": "One sentence for the Ask tab, e.g. 'This paper uses [methodology] to study [topic].'"
}

**argumentSpine**: Extract the paper's core argument as a chain of 5–8 logical steps. CRITICAL: Keep every string field to 15 words max. claim, connectionToNext, strengthJustification, comprehensionQuestion: one short sentence each. Omit supportingExcerpt and whyThisStepMatters to save space. Each step: claim, role (problem|gap|hypothesis|method|evidence|conclusion|limitation|implication), connectionToNext, connectionStrength (strong|moderate|weak), strengthJustification, relevantConceptIndices (array of indices into concepts), comprehensionQuestion (one short question). The chain represents the paper's actual reasoning structure.

**Audience level**: ${level}. ${li.summary}

**summary** (3-5 sentences max): Research problem, significance, methodology, key results, main innovation. ${li.summary}

**keyContributions**: 3-5 items, one sentence each.

**concepts** (4-6 terms): term + explanation (max 25 words per concept). ${li.concepts}

**eli12**: One short paragraph (max 80 words). Structural analogy mapping to paper components. Include eli12Mapping in one sentence. ${li.eli12}

**quizQuestions**: 4-5 questions. ${li.quiz}
- For multiple choice: make ALL wrong answers plausible. Each option max 15 words.
- At least 2 questions must test WHY the authors made a specific choice, not just WHAT.
- Every question MUST have "explanation" (one line, max 20 words).
- Include "relatedSpineIndices" per question (array of 0-based spine indices).

Each quiz question must have exactly one of these shapes:

1. Multiple choice: { "type": "multipleChoice", "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "why correct", "difficulty": "easy"|"medium"|"hard", "relatedSpineIndices": [0, 1] }
2. True/False: { "type": "trueFalse", "statement": "...", "correct": true|false, "explanation": "why correct", "difficulty": "easy"|"medium"|"hard", "relatedSpineIndices": [0, 1] }
3. Fill-in: { "type": "fillInBlank", "question": "Sentence with _____ for blank", "answer": "exact answer", "explanation": "why correct", "difficulty": "easy"|"medium"|"hard", "relatedSpineIndices": [0, 1] }

**citations**: MAX 8 references. Extract only the most cited/relevant. Per citation: authors (max 3 names), title (max 15 words), year, journal (abbreviated if long), volume, pages, doi. Skip volume/pages if not easily found. Do NOT format APA/MLA — we format in code. If no references found, use [].

**suggestedQuestions**: Return exactly 3 suggested follow-up questions a user might ask about this paper (e.g. "What are the limitations?", "How does the methodology compare to prior work?").

**topicOrMethodLine**: One sentence for the Ask tab context, e.g. "This paper uses randomized controlled trials to study the effect of X on Y." or "This paper applies transformer networks to machine translation."

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Research Paper:
${text}`;
}

/** Ultra-compact prompt for retry when MAX_TOKENS is hit. */
function buildCompactAnalysisPrompt(text: string, level: UserLevel): string {
  const li = LEVEL_INSTRUCTIONS[level];
  return `Analyze this paper. Return JSON only. Be extremely concise — every string max 12 words.

{
  "paperDomain": "domain",
  "paperType": "type",
  "argumentSpine": [{"claim":"...","role":"problem|gap|hypothesis|method|evidence|conclusion|limitation|implication","connectionToNext":"...","connectionStrength":"strong|moderate|weak","strengthJustification":"...","relevantConceptIndices":[],"comprehensionQuestion":"..."}],
  "summary": "3-4 sentences",
  "keyContributions": ["item1","item2","item3"],
  "concepts": [{"term":"...","explanation":"..."}],
  "eli12": "short analogy",
  "eli12Mapping": "mapping",
  "quizQuestions": [{"type":"multipleChoice","question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","relatedSpineIndices":[0]}],
  "citations": [{"authors":[],"title":"","year":"","journal":"","volume":"","pages":"","doi":""}],
  "suggestedQuestions": ["q1","q2","q3"],
  "topicOrMethodLine": "one sentence"
}

Rules: argumentSpine 4-6 steps, concepts 3-4 terms, quizQuestions 3-4. citations: MAX 5, title max 10 words, authors max 2. ${li.summary} ${li.concepts} ${li.eli12} ${li.quiz}
Level: ${level}. Return ONLY valid JSON. No markdown.

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
      maxOutputTokens: 65536,
    },
  });

  const truncatedText = truncatePaperMiddle(text);
  let prompt = buildAnalysisPrompt(truncatedText, level);
  let result = await model.generateContent(prompt);
  let response = result.response.text();

  const finishReason = result.response.candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS" && response) {
    console.warn("[Gemini] Response truncated (MAX_TOKENS). Retrying with compact prompt.");
    const compactPrompt = buildCompactAnalysisPrompt(truncatedText, level);
    result = await model.generateContent(compactPrompt);
    response = result.response.text();
  }

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

  // Format citations from structured fields (APA/MLA in code for consistency)
  let citations: CitationEntry[] | undefined;
  const rawCitations = data.citations;
  if (Array.isArray(rawCitations)) {
    citations = (rawCitations as Record<string, unknown>[]).map((c) => {
      const fields: CitationFields = {
        authors: Array.isArray(c.authors) ? (c.authors as string[]).map(String) : [],
        title: String(c.title ?? ""),
        year: c.year ? String(c.year) : undefined,
        journal: c.journal ? String(c.journal) : undefined,
        volume: c.volume ? String(c.volume) : undefined,
        pages: c.pages ? String(c.pages) : undefined,
        doi: c.doi ? String(c.doi) : undefined,
      };
      return {
        raw: c.raw ? String(c.raw) : undefined,
        apa: formatAPA(fields),
        mla: formatMLA(fields),
      };
    });
    if (citations.length === 0) citations = undefined;
  }
  // Fallback: legacy format with pre-formatted apa/mla
  if (!citations && Array.isArray(rawCitations)) {
    const legacy = rawCitations as { raw?: string; apa?: string; mla?: string }[];
    if (legacy.some((c) => c.apa || c.mla)) {
      citations = legacy.map((c) => ({
        raw: c.raw,
        apa: String(c.apa ?? ""),
        mla: String(c.mla ?? ""),
      }));
    }
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

  const paperDomain = data.paperDomain ? String(data.paperDomain) : undefined;
  const paperType = data.paperType ? String(data.paperType) : undefined;
  const suggestedQuestions = Array.isArray(data.suggestedQuestions)
    ? (data.suggestedQuestions as string[]).map(String).slice(0, 3)
    : undefined;
  const topicOrMethodLine = data.topicOrMethodLine ? String(data.topicOrMethodLine).trim() : undefined;
  const eli12Mapping = data.eli12Mapping ? String(data.eli12Mapping) : undefined;

  // Build eli12 with mapping appended if present
  let eli12 = String(data.eli12);
  if (eli12Mapping) {
    eli12 += `\n\n**Mapping:** ${eli12Mapping}`;
  }

  let analysisConfidence: number | undefined;
  try {
    analysisConfidence = await getAnalysisConfidence(model, truncatedText);
  } catch {
    // Non-fatal: continue without confidence
  }

  const ROLES: ArgumentSpineNode["role"][] = [
    "problem", "gap", "hypothesis", "method", "evidence",
    "conclusion", "limitation", "implication",
  ];
  const STRENGTHS: ArgumentSpineNode["connectionStrength"][] = ["strong", "moderate", "weak"];

  let argumentSpine: ArgumentSpineNode[] | undefined;
  if (Array.isArray(data.argumentSpine) && data.argumentSpine.length >= 3 && data.argumentSpine.length <= 10) {
    const conceptsLength = (data.concepts as unknown[]).length;
    argumentSpine = (data.argumentSpine as Record<string, unknown>[]).map((n) => {
      const rawIndices = Array.isArray(n.relevantConceptIndices) ? n.relevantConceptIndices : [];
      const relevantConceptIndices = rawIndices
        .map((i) => Number(i))
        .filter((i) => Number.isInteger(i) && i >= 0 && i < conceptsLength);
      const strength = STRENGTHS.includes(n.connectionStrength as ArgumentSpineNode["connectionStrength"])
        ? (n.connectionStrength as ArgumentSpineNode["connectionStrength"])
        : "moderate";
      const role = ROLES.includes(n.role as ArgumentSpineNode["role"])
        ? (n.role as ArgumentSpineNode["role"])
        : "conclusion";
      return {
        claim: String(n.claim ?? ""),
        role,
        connectionToNext: String(n.connectionToNext ?? ""),
        connectionStrength: strength,
        strengthJustification: String(n.strengthJustification ?? ""),
        relevantConceptIndices,
        supportingExcerpt: n.supportingExcerpt ? String(n.supportingExcerpt) : undefined,
        whyThisStepMatters: n.whyThisStepMatters ? String(n.whyThisStepMatters) : undefined,
        comprehensionQuestion: String(n.comprehensionQuestion ?? ""),
      };
    });
    if (argumentSpine.length < 3) argumentSpine = undefined;
  }

  return {
    summary: String(data.summary),
    keyContributions: (data.keyContributions as string[]).map(String),
    concepts: (data.concepts as { term: string; explanation: string }[]).map(
      (c) => ({ term: String(c.term), explanation: String(c.explanation) })
    ),
    eli12,
    eli12Mapping,
    quizQuestions,
    citations: citations?.length ? citations : undefined,
    paperDomain,
    paperType,
    suggestedQuestions,
    topicOrMethodLine,
    analysisConfidence,
    argumentSpine,
  };
}

/** Second Gemini call to rate analysis quality 1-5 based on extracted text. */
async function getAnalysisConfidence(
  model: Awaited<ReturnType<typeof genAI.getGenerativeModel>>,
  paperExcerpt: string
): Promise<number> {
  const excerpt = paperExcerpt.slice(0, 8000);
  const prompt = `Below is extracted text from a research paper PDF. Rate 1-5 how well this text could be analyzed:
- 5: Full text, clear structure, equations readable, no garbled sections
- 4: Minor gaps (e.g. some figures/equations as placeholders)
- 3: Moderate issues (e.g. garbled equations, fragmented tables)
- 2: Significant issues (e.g. large sections unreadable, many short fragmented lines)
- 1: Severe problems (e.g. mostly gibberish, OCR failures)

Extracted text excerpt:
${excerpt}

Return ONLY a single digit 1-5. No explanation.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim() ?? "";
  const num = parseInt(text.replace(/\D/g, "").slice(0, 1), 10);
  return num >= 1 && num <= 5 ? num : 3;
}

export interface AskResult {
  answer: string;
  suggestedFollowUp?: string;
}

export async function askAboutPaper(
  paperText: string,
  analysis: { summary: string; keyContributions: string[]; concepts: { term: string; explanation: string }[]; eli12: string },
  question: string,
  history?: { role: "user" | "model"; content: string }[]
): Promise<AskResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  const truncatedPaper = truncatePaperMiddle(paperText);

  const context = `## Paper excerpt (for context)\n${truncatedPaper}\n\n## Summary\n${analysis.summary}\n\n## Key contributions\n${analysis.keyContributions.join("\n")}\n\n## Concepts (selected)\n${analysis.concepts.slice(0, 15).map((c) => `- ${c.term}: ${c.explanation.slice(0, 200)}...`).join("\n")}\n\n## ELI12\n${analysis.eli12}`;

  let prompt = `You are a helpful tutor. Answer the user's question based ONLY on the paper and analysis below. Be concise and accurate.

CRITICAL: If the question cannot be answered from the paper's content, say so explicitly. Do NOT fabricate an answer. Instead, suggest what section of the paper the user might re-read to find related information (e.g. "The methodology section" or "the results discussion").

After your answer, on a new line, suggest one short follow-up question the user might ask next. Format it exactly as: FOLLOW_UP: <question>

${context}

`;

  if (history?.length) {
    for (const msg of history.slice(-10)) {
      prompt += msg.role === "user" ? `User: ${msg.content}\n\n` : `Assistant: ${msg.content}\n\n`;
    }
  }

  prompt += `User: ${question}\n\nAssistant:`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text()?.trim() ?? "";
  const followUpMatch = raw.match(/\n\s*FOLLOW_UP:\s*([\s\S]+?)(?:\n|$)/);
  const answer = followUpMatch ? raw.slice(0, raw.indexOf("FOLLOW_UP:")).trim() : raw;
  const suggestedFollowUp = followUpMatch ? followUpMatch[1].trim() : undefined;
  return {
    answer: answer || "I couldn't generate a response.",
    suggestedFollowUp: suggestedFollowUp || undefined,
  };
}

/** Evaluate whether the user's free-text answer shows understanding of a spine step. */
export async function evaluateSpineComprehension(
  paperContext: string,
  node: { claim: string; role: string; connectionToNext: string; comprehensionQuestion: string },
  userAnswer: string
): Promise<SpineCheckResult> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are evaluating whether a reader understood one step of a research paper's argument.

Context from the paper:
${paperContext}

Argument step (role: ${node.role}): ${node.claim}
Why it leads to next: ${node.connectionToNext}
Comprehension question asked: ${node.comprehensionQuestion}

User's answer: ${userAnswer}

Determine if the user's answer shows genuine understanding of this step. Reply with JSON only: { "understood": true or false, "feedback": "string" }.
- If understood: feedback is a brief confirmation (1 sentence).
- If not: feedback gently corrects the misconception without giving away the full answer. One or two sentences.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim() ?? "";
  try {
    const parsed = parseGeminiJson(text) as { understood?: boolean; feedback?: string };
    return {
      understood: Boolean(parsed.understood),
      feedback: String(parsed.feedback ?? ""),
    };
  } catch {
    return { understood: false, feedback: "We couldn't evaluate your answer. Try rephrasing." };
  }
}

/** Generate vulnerability map: per-spine-node fragility analysis. */
export async function getVulnerabilityMap(
  paperText: string,
  result: AnalysisResult
): Promise<VulnerabilityMap> {
  const spine = result.argumentSpine;
  if (!spine || spine.length === 0) {
    return { nodes: [] };
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const truncatedPaper = truncatePaperMiddle(paperText).slice(0, 20000);
  const spineSummary = spine
    .map((n, i) => `[${i}] ${n.role}: ${n.claim}`)
    .join("\n");

  const prompt = `You are a critical researcher. For each argument step below, identify what would weaken or break it.

Paper excerpt (for context):
${truncatedPaper}

Argument spine (index, role, claim):
${spineSummary}

Return a JSON object with exactly this structure:
{
  "nodes": [
    {
      "spineIndex": 0,
      "fragilityScore": 3,
      "assumptionsThatWouldCollapse": ["assumption 1", "assumption 2"],
      "dataThatWouldContradict": "one sentence",
      "alternativeExplanationsNotAddressed": "one sentence"
    }
  ]
}

For each spine node (0 to ${spine.length - 1}):
- fragilityScore: 1 (robust) to 5 (very fragile). How easily could this step be undermined?
- assumptionsThatWouldCollapse: 1-3 assumptions that, if false, would collapse the conclusions
- dataThatWouldContradict: what data would contradict the findings (max 20 words)
- alternativeExplanationsNotAddressed: what alternative explanations weren't addressed (max 20 words)

Keep every string concise (max 20 words). Return ONLY valid JSON.`;

  const genResult = await model.generateContent(prompt);
  const text = genResult.response.text()?.trim() ?? "";
  const parsed = parseGeminiJson(text) as { nodes?: Array<Record<string, unknown>> };

  if (!Array.isArray(parsed.nodes)) {
    return { nodes: [] };
  }

  const nodes: VulnerabilityNode[] = parsed.nodes
    .filter((n) => typeof n.spineIndex === "number" && n.spineIndex >= 0 && n.spineIndex < spine.length)
    .map((n) => {
      const score = Math.min(5, Math.max(1, Number(n.fragilityScore) || 3)) as 1 | 2 | 3 | 4 | 5;
      return {
        spineIndex: n.spineIndex as number,
        fragilityScore: score,
        assumptionsThatWouldCollapse: Array.isArray(n.assumptionsThatWouldCollapse)
          ? n.assumptionsThatWouldCollapse.map(String).slice(0, 3)
          : [],
        dataThatWouldContradict: n.dataThatWouldContradict ? String(n.dataThatWouldContradict) : undefined,
        alternativeExplanationsNotAddressed: n.alternativeExplanationsNotAddressed
          ? String(n.alternativeExplanationsNotAddressed)
          : undefined,
      };
    });

  return { nodes };
}

/** Generate methodology transfer suggestions for applying the paper's approach to other domains. */
export async function getMethodologyTransferSuggestions(
  paperText: string,
  result: AnalysisResult,
  targetDomains?: string[]
): Promise<MethodologyTransferSuggestion[]> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const truncatedPaper = truncatePaperMiddle(paperText).slice(0, 15000);
  const domains = targetDomains?.length
    ? targetDomains.slice(0, 4)
    : ["education", "housing", "climate", "finance"];

  const prompt = `You are helping a researcher apply a methodology to new domains.

Paper excerpt:
${truncatedPaper}

Summary: ${result.summary}
Key contributions: ${result.keyContributions.join("; ")}
Methodology/topic: ${result.topicOrMethodLine ?? result.paperDomain ?? "unknown"}

Identify the core methodology (e.g. difference-in-differences, RCT, survey design, case study). For each target domain below, provide 2-4 concrete adaptation steps and key considerations.

Target domains: ${domains.join(", ")}

Return JSON only:
{
  "suggestions": [
    {
      "targetDomain": "education",
      "adaptationSteps": ["step 1", "step 2", "step 3"],
      "keyConsiderations": "1-2 sentences"
    }
  ]
}

Be concrete and actionable. Each step should be specific enough for a student to follow. Return ONLY valid JSON.`;

  const genResult = await model.generateContent(prompt);
  const text = genResult.response.text()?.trim() ?? "";
  const parsed = parseGeminiJson(text) as { suggestions?: Array<Record<string, unknown>> };

  if (!Array.isArray(parsed.suggestions)) {
    return [];
  }

  return parsed.suggestions
    .filter((s) => s.targetDomain && Array.isArray(s.adaptationSteps))
    .map((s) => ({
      targetDomain: String(s.targetDomain),
      adaptationSteps: (s.adaptationSteps as string[]).map(String),
      keyConsiderations: String(s.keyConsiderations ?? ""),
    }))
    .slice(0, 4);
}

/** Compare multiple papers for contradictions and spine divergence. */
export async function comparePapers(
  analyses: Array<{ slug: string; fileName: string | null; result: AnalysisResult }>
): Promise<CrossPaperComparison> {
  if (analyses.length < 2) {
    return { contradictions: [], spineDivergence: [] };
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const papersContext = analyses
    .map((a) => {
      const spine = a.result.argumentSpine
        ?.map((n, i) => `  [${i}] ${n.role}: ${n.claim}`)
        .join("\n") ?? "No argument spine";
      return `Paper: ${a.fileName ?? a.slug}
Slug: ${a.slug}
Summary: ${a.result.summary}
Contributions: ${a.result.keyContributions.join("; ")}
Argument spine:
${spine}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are comparing ${analyses.length} research papers on related topics. Identify where they disagree.

${papersContext}

Return JSON only:
{
  "contradictions": [
    {
      "type": "conclusion" | "methodology" | "assumption" | "citation_interpretation",
      "description": "one sentence describing the disagreement",
      "paperSlugs": ["slug1", "slug2"]
    }
  ],
  "spineDivergence": [
    {
      "role": "method",
      "papersByClaim": { "slug1": "claim from paper 1", "slug2": "claim from paper 2" },
      "divergenceNote": "how they differ"
    }
  ],
  "sharedCitationsInterpretation": "optional: if papers cite same work differently, describe"
}

For each role (problem, gap, hypothesis, method, evidence, conclusion, limitation, implication) present in the papers, include a spineDivergence entry showing how each paper's claim differs. Use the actual slugs from the input. Keep descriptions concise. Return ONLY valid JSON.`;

  const genResult = await model.generateContent(prompt);
  const text = genResult.response.text()?.trim() ?? "";
  const parsed = parseGeminiJson(text) as {
    contradictions?: Array<Record<string, unknown>>;
    spineDivergence?: Array<Record<string, unknown>>;
    sharedCitationsInterpretation?: string;
  };

  const contradictions: ContradictionPoint[] = (parsed.contradictions ?? [])
    .filter((c) => c.type && c.description && Array.isArray(c.paperSlugs))
    .map((c) => ({
      type: c.type as ContradictionPoint["type"],
      description: String(c.description),
      paperSlugs: (c.paperSlugs as string[]).map(String),
      spineIndicesBySlug: c.spineIndicesBySlug as Record<string, number[]> | undefined,
    }));

  const spineDivergence: SpineDivergence[] = (parsed.spineDivergence ?? [])
    .filter((s) => s.role && s.papersByClaim && typeof s.papersByClaim === "object")
    .map((s) => ({
      role: s.role as SpineDivergence["role"],
      papersByClaim: s.papersByClaim as Record<string, string>,
      divergenceNote: s.divergenceNote ? String(s.divergenceNote) : undefined,
    }));

  return {
    contradictions,
    spineDivergence,
    sharedCitationsInterpretation: parsed.sharedCitationsInterpretation
      ? String(parsed.sharedCitationsInterpretation)
      : undefined,
  };
}
