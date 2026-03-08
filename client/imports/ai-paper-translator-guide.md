# 🧠 AI Research Paper Translator — Cursor Implementation Guide

> **AI Provider:** Google Gemini (`gemini-2.0-flash`)
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Google Generative AI SDK
> **Target Users:** University students (CU Boulder and beyond)

---

## Project Setup

### 1. Initialize the Project

Open Cursor terminal and run:

```bash
npx create-next-app@latest ai-paper-translator --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ai-paper-translator
```

### 2. Install Dependencies

```bash
npm install @google/generative-ai pdf-parse react-dropzone lucide-react framer-motion
npm install -D @types/pdf-parse
npx shadcn@latest init
npx shadcn@latest add button card tabs badge progress separator scroll-area accordion
```

### 3. Environment Variables

Create `.env.local` at the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your key from [Google AI Studio](https://aistudio.google.com/apikey).

---

## Folder Structure

Prompt Cursor with:

> "Create the following folder structure for a Next.js 14 App Router project."

```
src/
├── app/
│   ├── layout.tsx              # Root layout with font + metadata
│   ├── page.tsx                # Landing / upload page
│   ├── results/
│   │   └── page.tsx            # Results display page
│   └── api/
│       └── analyze/
│           └── route.ts        # POST endpoint — Gemini processing
├── components/
│   ├── FileUpload.tsx          # Drag-and-drop PDF uploader
│   ├── ResultsView.tsx         # Tabbed results display
│   ├── SummarySection.tsx      # Plain-language summary
│   ├── KeyContributions.tsx    # Bullet list of contributions
│   ├── ConceptsExplainer.tsx   # Technical terms breakdown
│   ├── ELI12Section.tsx        # "Explain Like I'm 12"
│   ├── QuizSection.tsx         # Interactive quiz component
│   ├── LoadingState.tsx        # Skeleton / progress animation
│   └── Navbar.tsx              # Top navigation bar
├── lib/
│   ├── gemini.ts               # Gemini client setup + prompt builder
│   ├── pdf-parser.ts           # PDF text extraction utility
│   └── types.ts                # Shared TypeScript interfaces
└── styles/
    └── globals.css             # Tailwind base + custom styles
```

---

## Step-by-Step Implementation

### STEP 1 — TypeScript Interfaces

**Prompt Cursor:**

> "Create `src/lib/types.ts` with TypeScript interfaces for the paper analysis system. Define an `AnalysisResult` interface with these fields: `summary` (string), `keyContributions` (string array), `concepts` (array of objects with `term` and `explanation`), `eli12` (string), and `quizQuestions` (array of objects with `question`, `options` string array, `correctAnswer` number, and `explanation`). Also define an `UploadState` type that can be `idle`, `uploading`, `processing`, or `complete`."

Expected output:

```typescript
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
```

---

### STEP 2 — PDF Text Extraction

**Prompt Cursor:**

> "Create `src/lib/pdf-parser.ts`. Write an async function `extractTextFromPDF` that takes a `Buffer` and returns a `string`. Use the `pdf-parse` library. Strip excessive whitespace and limit output to 30,000 characters so it fits within Gemini's context window. Add error handling that throws a descriptive error if parsing fails."

---

### STEP 3 — Gemini Client and Prompt Engineering

**Prompt Cursor:**

> "Create `src/lib/gemini.ts`. Set up the Google Generative AI client using `@google/generative-ai` with the `GEMINI_API_KEY` env variable and the `gemini-2.0-flash` model.
>
> Write an async function `analyzeResearchPaper(text: string): Promise<AnalysisResult>` that sends the extracted paper text to Gemini with a structured prompt.
>
> The prompt should instruct Gemini to return ONLY valid JSON (no markdown fences) matching the `AnalysisResult` interface. The prompt should include these sections:
>
> 1. **Summary** — 3–5 sentences, plain language, no jargon.
> 2. **Key Contributions** — 3–6 bullet points of what the paper introduces or advances.
> 3. **Important Concepts** — 5–8 technical terms with simple explanations.
> 4. **Explain Like I'm 12** — Rewrite the entire paper's purpose as if explaining to a 12-year-old using analogies and everyday language.
> 5. **Quiz Questions** — 5 multiple-choice questions (4 options each) testing comprehension, with correct answer index and a short explanation.
>
> Use `generationConfig` with `responseMimeType: 'application/json'` to enforce JSON output. Parse the response with `JSON.parse` and validate it has all required fields. Throw descriptive errors on failure."

Key implementation detail — the Gemini call should look like this:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeResearchPaper(text: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const prompt = `You are an expert academic tutor. Analyze the following research paper and return a JSON object with exactly this structure: { "summary": "...", "keyContributions": ["..."], "concepts": [{"term": "...", "explanation": "..."}], "eli12": "...", "quizQuestions": [{"question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..."}] }

Rules:
- summary: 3-5 sentences, no jargon, plain language
- keyContributions: 3-6 items describing what the paper introduces
- concepts: 5-8 technical terms with simple one-sentence explanations
- eli12: explain the paper as if talking to a 12-year-old, use fun analogies
- quizQuestions: exactly 5 multiple choice questions, 4 options each, correctAnswer is zero-indexed

Research Paper:
${text}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  return JSON.parse(response) as AnalysisResult;
}
```

---

### STEP 4 — API Route

**Prompt Cursor:**

> "Create `src/app/api/analyze/route.ts` as a Next.js App Router POST handler.
>
> It should:
> 1. Accept `multipart/form-data` with a single file field named `paper`.
> 2. Validate the file exists and is a PDF (check MIME type).
> 3. Validate file size is under 10 MB.
> 4. Convert the file to a Buffer, extract text using `extractTextFromPDF`.
> 5. If extracted text is under 100 characters, return a 400 error saying the PDF has too little readable text.
> 6. Pass the text to `analyzeResearchPaper` from the Gemini module.
> 7. Return the `AnalysisResult` as JSON with status 200.
> 8. Catch errors and return a 500 with a `{ error: string }` body.
>
> Use Next.js `NextRequest` and `NextResponse`. Do NOT use any external body-parsing libraries — use the built-in `request.formData()` API."

---

### STEP 5 — File Upload Component

**Prompt Cursor:**

> "Create `src/components/FileUpload.tsx`, a React client component using `react-dropzone`.
>
> Design:
> - Large drop zone with a dashed border, paper/upload icon from `lucide-react`, and helper text.
> - Accept only `.pdf` files, max 10 MB.
> - On drop, show the file name and a styled upload button.
> - On upload, POST the file to `/api/analyze` as `FormData`.
> - Show an animated progress/loading state while processing (use `framer-motion` for a pulsing animation).
> - On success, store the result in state and call an `onResult` callback prop with the `AnalysisResult`.
> - On error, display an inline error message with a retry option.
>
> Style with Tailwind. Use a warm, academic aesthetic — think off-white backgrounds, deep navy accents, and a serif display font for headings. Avoid generic purple gradients."

---

### STEP 6 — Results Display Components

**Prompt Cursor (ResultsView):**

> "Create `src/components/ResultsView.tsx` that takes an `AnalysisResult` prop and renders a tabbed interface using shadcn `Tabs`. The five tabs are: Summary, Key Contributions, Concepts, ELI12, and Quiz. Each tab renders its corresponding sub-component. Add a fade-in animation when switching tabs using `framer-motion`. Include a 'Download as PDF' button placeholder in the header."

**Prompt Cursor (SummarySection):**

> "Create `src/components/SummarySection.tsx`. It receives `summary: string` and renders it in a clean card with a book icon, styled with large readable text (text-lg), comfortable line height, and a subtle background."

**Prompt Cursor (KeyContributions):**

> "Create `src/components/KeyContributions.tsx`. It receives `contributions: string[]` and renders each as a styled card or list item with a checkmark/star icon, numbered sequentially."

**Prompt Cursor (ConceptsExplainer):**

> "Create `src/components/ConceptsExplainer.tsx`. It receives `concepts: { term: string; explanation: string }[]` and renders them as an accordion (using shadcn `Accordion`) where each item shows the term as the trigger and the explanation as the content. Add a small `BookOpen` icon next to each term."

**Prompt Cursor (ELI12Section):**

> "Create `src/components/ELI12Section.tsx`. It receives `eli12: string` and renders it in a fun, friendly card with a light background, a brain/lightbulb emoji or icon, and slightly playful typography. Use a rounded card style with a colored left border accent."

**Prompt Cursor (QuizSection):**

> "Create `src/components/QuizSection.tsx` as an interactive quiz component.
>
> It receives `quizQuestions` from `AnalysisResult`. Features:
> - Show one question at a time with a progress indicator (e.g., 'Question 2 of 5').
> - Display 4 clickable option cards.
> - On selection: highlight green for correct, red for incorrect, and show the explanation below.
> - 'Next Question' button to advance.
> - After the last question, show a score summary card (e.g., '4/5 — Great job!') with a 'Retake Quiz' button.
> - Add subtle animations on selection and transitions between questions."

---

### STEP 7 — Main Pages

**Prompt Cursor (Landing Page):**

> "Create `src/app/page.tsx` as a client component. It should:
> 1. Show a hero section with the app title '🧠 AI Research Paper Translator', a subtitle like 'Upload any research paper and get an instant, student-friendly breakdown', and the `FileUpload` component.
> 2. Below the uploader, show a small 'How it works' section with 3 icon cards: Upload PDF → AI Analyzes → Learn & Quiz.
> 3. When analysis completes, smoothly scroll down and reveal the `ResultsView` component with the results.
> 4. Use `framer-motion` for entrance animations.
>
> Style: Use a clean academic aesthetic. Off-white or warm cream background (#FAFAF7 or similar). Deep navy (#1a2332) for text and accents. A serif font like `Playfair Display` for headings (import from Google Fonts in layout.tsx) and a clean sans-serif like `Source Sans 3` for body text."

**Prompt Cursor (Layout):**

> "Update `src/app/layout.tsx` to import `Playfair Display` and `Source Sans 3` from `next/font/google`. Set Playfair Display as a CSS variable `--font-heading` and Source Sans 3 as the default body font. Add proper metadata: title 'AI Research Paper Translator', description 'Make research papers easy to understand with AI'."

---

### STEP 8 — Loading State

**Prompt Cursor:**

> "Create `src/components/LoadingState.tsx` that shows an engaging loading animation while the paper is being analyzed. Include:
> - A pulsing brain or document icon.
> - Rotating status messages like 'Reading your paper...', 'Extracting key ideas...', 'Generating quiz questions...', 'Almost done...' that cycle every 3 seconds.
> - A subtle progress bar or animated dots.
> - Use `framer-motion` for all animations."

---

### STEP 9 — Navbar

**Prompt Cursor:**

> "Create `src/components/Navbar.tsx` with the app logo/title on the left ('🧠 PaperTranslator') and a GitHub link icon on the right. Keep it minimal — sticky top, slight backdrop blur, clean border bottom."

---

## Gemini-Specific Configuration Notes

Provide these to Cursor when troubleshooting:

1. **Model Selection** — Use `gemini-2.0-flash` for speed at hackathon scale. Switch to `gemini-2.0-pro` if quality needs improvement on complex papers.

2. **JSON Mode** — Always set `responseMimeType: "application/json"` in `generationConfig`. This forces Gemini to return raw JSON without markdown code fences.

3. **Temperature** — Use `0.3`–`0.5` for factual analysis sections (summary, contributions, concepts). Use `0.7`+ only if the ELI12 section feels too dry.

4. **Token Limits** — `gemini-2.0-flash` supports ~1M tokens of context. For safety, cap extracted PDF text at 30,000 characters (~7,500 tokens). Set `maxOutputTokens: 4096` for the response.

5. **Rate Limits** — The free tier allows 15 RPM. Add basic retry logic with exponential backoff in the API route if needed.

6. **Error Shape** — Gemini errors surface as thrown exceptions from `generateContent()`. Wrap in try/catch and check `error.message` for common issues like safety blocks or quota limits.

---

## .cursorrules File

Save this at the project root as `.cursorrules` so Cursor respects it across all prompts:

```
You are building an AI Research Paper Translator using Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, and the Google Generative AI SDK (Gemini).

Tech stack rules:
- Always use the App Router (src/app/) with server/client component separation.
- API routes go in src/app/api/ using NextRequest/NextResponse.
- Use "use client" directive only when the component needs interactivity, hooks, or browser APIs.
- Use @google/generative-ai SDK for all Gemini calls. Model: gemini-2.0-flash.
- Always use generationConfig with responseMimeType: "application/json" when expecting structured output from Gemini.
- Use pdf-parse for server-side PDF text extraction.
- Style with Tailwind CSS utility classes. Use shadcn/ui components where available.
- Use framer-motion for animations and transitions.
- Use lucide-react for icons.

Design rules:
- Academic, warm aesthetic: off-white backgrounds (#FAFAF7), deep navy text (#1a2332).
- Serif heading font (Playfair Display), clean sans-serif body (Source Sans 3).
- Avoid generic AI aesthetics (no purple gradients, no Inter/Roboto).
- Cards should have subtle shadows, rounded corners (rounded-xl), and comfortable padding.
- All interactive elements need hover states and transitions.

Code quality:
- Full TypeScript with strict types. No 'any' types.
- Descriptive variable/function names.
- Error boundaries around AI calls.
- Loading and error states for every async operation.
- Components should be small and focused (< 150 lines each).

File conventions:
- Components: PascalCase in src/components/
- Utilities: camelCase in src/lib/
- Types: src/lib/types.ts
- One component per file.
```

---

## Testing Checklist

Use this to verify each feature works before demo:

| # | Feature | How to Test |
|---|---------|------------|
| 1 | PDF upload | Drop a real research paper PDF onto the uploader |
| 2 | File validation | Try uploading a .txt or .png — should reject |
| 3 | Size limit | Try a 15 MB PDF — should show error |
| 4 | API route | POST to `/api/analyze` with a PDF via Postman or curl |
| 5 | Summary tab | Verify plain-language output, no jargon |
| 6 | Key Contributions | Check 3–6 bullet items render correctly |
| 7 | Concepts | Accordion opens/closes, terms are explained simply |
| 8 | ELI12 | Should use analogies and simple language |
| 9 | Quiz | Select answers, check correct/incorrect highlighting, score tallies |
| 10 | Error handling | Disconnect internet, upload — should show friendly error |
| 11 | Loading states | Verify animated messages cycle during processing |
| 12 | Mobile responsive | Test on phone viewport — all sections should stack cleanly |

---

## Quick Start Commands

```bash
# Development
npm run dev

# Build check
npm run build

# Lint
npm run lint
```

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel

# Set environment variable in Vercel dashboard:
# GEMINI_API_KEY = your_key
```

Ensure the `api/analyze` route's max duration is sufficient. Add to `next.config.js` if on Vercel Pro:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
```

---

## Common Cursor Prompts for Debugging

| Problem | Prompt to Use |
|---------|--------------|
| Gemini returns markdown instead of JSON | "The Gemini response includes markdown backticks around the JSON. Update the gemini.ts to strip any markdown fences before JSON.parse, and ensure responseMimeType is set to application/json in generationConfig." |
| PDF extraction returns empty string | "The PDF text extraction is returning empty. Add a fallback that checks if text length is 0 and throws an error saying the PDF may be image-based and needs OCR." |
| Quiz answers not highlighting | "The quiz option cards are not changing color on selection. Update QuizSection.tsx to track the selected answer index in state, compare it against correctAnswer, and apply green/red border and background classes conditionally." |
| Hydration mismatch errors | "I'm getting hydration errors. Check if any component using hooks or browser APIs is missing the 'use client' directive. Also check for conditional rendering that differs between server and client." |
| Slow API response | "The /api/analyze endpoint is slow. Add streaming status updates — return a 202 immediately, process in the background, and have the client poll a status endpoint. Or switch to server-sent events." |