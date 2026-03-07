# 🧠 AI Research Paper Translator

Upload any research paper and get an instant, student-friendly breakdown — summary, key concepts, ELI12, and a quiz to test your understanding.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Google Gemini

## Quick Start

```bash
# Install dependencies (already done)
npm install

# Set up environment
cp .env.local.example .env.local
# Add your GEMINI_API_KEY from https://aistudio.google.com/apikey

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **PDF Upload** — Drag & drop research papers (max 10 MB)
- **AI Summary** — Plain-language 3–5 sentence summary
- **Key Contributions** — Bullet list of what the paper introduces
- **Concepts** — Technical terms explained simply (accordion)
- **ELI12** — "Explain Like I'm 12" with analogies
- **Quiz** — 5 multiple-choice questions to test comprehension

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/analyze/route.ts
├── components/
│   ├── FileUpload.tsx
│   ├── ResultsView.tsx
│   ├── SummarySection.tsx
│   ├── KeyContributions.tsx
│   ├── ConceptsExplainer.tsx
│   ├── ELI12Section.tsx
│   ├── QuizSection.tsx
│   ├── LoadingState.tsx
│   └── Navbar.tsx
└── lib/
    ├── types.ts
    ├── pdf-parser.ts
    └── gemini.ts
```

## Build & Deploy

```bash
npm run build
npm run start
```

For Vercel: `vercel` and set `GEMINI_API_KEY` in the dashboard.
