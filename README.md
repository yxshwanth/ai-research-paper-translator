# PaperLens — AI Research Paper Explanator

Upload any research paper and get a structured breakdown: **Argument Spine** (the paper's logical chain), summary, key concepts, ELI12, flashcards, quiz, and follow-up Q&A. Tailored to your expertise level (Beginner / Intermediate / Expert).

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Google Gemini · PostgreSQL (Prisma) · Auth0

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Add GEMINI_API_KEY from https://aistudio.google.com/apikey

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Argument Spine** — Logical chain of 5–8 steps (problem → gap → method → evidence → conclusion) with strength indicators
- **Summary & Key Contributions** — Plain-language overview
- **Concepts** — Technical terms explained (accordion)
- **ELI12** — "Explain Like I'm 12" with structural analogies
- **Flashcards** — Spaced repetition (when logged in)
- **Quiz** — Multiple choice, T/F, fill-in; compact mode; targeted review
- **Ask** — Follow-up Q&A with suggested questions
- **Apply methodology** — Suggestions for adapting the paper's approach to other domains
- **Vulnerability Map** — Per-step critique: what would break this argument?
- **Compare papers** — Cross-paper contradiction detection (2–5 papers)
- **Share** — Public links; optional Auth0 login for My Papers, quiz history, spaced rep

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | [Get key](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | No | Default: `gemini-2.5-flash-lite` |
| `DATABASE_URL` | For persistence | PostgreSQL connection string |
| `AUTH0_SECRET` | For auth | `openssl rand -hex 32` |
| `AUTH0_DOMAIN` | For auth | e.g. `tenant.us.auth0.com` |
| `AUTH0_CLIENT_ID` | For auth | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | For auth | Auth0 application client secret |
| `APP_BASE_URL` | No | e.g. `http://localhost:3000` |

## Auth0 Setup

1. Create a **Regular Web Application** in [Auth0 Dashboard](https://manage.auth0.com)
2. **Allowed Callback URLs:** `http://localhost:3000/auth/callback`
3. **Allowed Logout URLs:** `http://localhost:3000` (add production URL for deploy)

## Project Structure

```
src/
├── app/
│   ├── api/analyze/stream/   # Streaming PDF analysis (SSE)
│   ├── api/paper/            # Ask, spine-check, vulnerability, methodology-transfer, compare
│   ├── compare/               # Cross-paper comparison page
│   ├── dashboard/            # My Papers (auth)
│   ├── share/[slug]/         # Public share page
│   └── page.tsx              # Home: upload + results
├── components/
│   ├── ArgumentSpineView.tsx
│   ├── FileUpload.tsx
│   ├── SteppedProgress.tsx
│   ├── ResultsView.tsx       # Phase tabs: Understand | Learn | Test
│   ├── FlashcardsView.tsx
│   ├── QuizSection.tsx
│   ├── AskSection.tsx
│   └── ...
├── lib/
│   ├── gemini.ts
│   ├── pdf-parser.ts
│   ├── citations.ts
│   └── ...
└── proxy.ts                  # Auth0 (Next.js 16)
```

## Scripts

```bash
npm run dev      # Development
npm run build    # Prisma generate + Next.js build
npm run start    # Production
npm run db:push  # Push Prisma schema
npm run db:studio # Prisma Studio
```

## Deploy

- **Vercel:** `vercel` — set env vars in dashboard
- **Database:** PostgreSQL required for analyses, quiz, flashcards
- **Auth0:** Add production callback and logout URLs

## Demo recording
https://drive.google.com/file/d/1qMmLNVuWcvcVT0zyHcQO7IAKppKIq-b6/view?usp=sharing