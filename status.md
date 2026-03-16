# Project Status

## Project Overview

**Name:** English Learning Flashcard App  
**Type:** Web Application (Next.js)  
**Purpose:** A spaced repetition flashcard app for learning English vocabulary and sentences

## Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Lucide React | 0.575.0 |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/gemini/        # Gemini API proxy (optional)
│   ├── study/             # Study pages (all, words, sentences)
│   ├── manage/            # Card CRUD
│   ├── reset/             # Reset progress
│   ├── settings/          # User preferences
│   ├── page.tsx           # Dashboard
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # Client providers
├── components/             # UI components
│   ├── WordCard.tsx
│   ├── SentenceCard.tsx
│   └── Navbar.tsx
├── context/               # React Context
│   ├── CardContext.tsx    # Card state & progress
│   └── ThemeContext.tsx   # Dark/light mode
├── hooks/                 # Custom hooks
│   └── useStudySession.ts
├── lib/                   # Utilities
│   ├── types.ts
│   ├── storage.ts
│   ├── studyUtils.ts
│   ├── studyQueue.ts
│   └── defaultCards.ts
└── data/
    └── vocab.json         # Card content (49 words, 53 sentences)
```

## Features

- **Dashboard** - Overview of progress (unseen, mastered, due for review)
- **Study Sessions** - Review cards with spaced repetition
  - All cards
  - Words only
  - Sentences only
- **Card Management** - Add/edit/delete custom cards
- **Reset Progress** - Clear progress (words only, sentences only, or all)
- **Settings** - Configure study session (cards per session)
- **Theme Toggle** - Dark/light mode
- **Gemini API Integration** - Optional AI hints (server-side)

## Data Persistence

- **localStorage** - Progress and preferences stored locally
- **Key:** `english_trainer_state`

## Card Content

- **Words:** 49 vocabulary items
- **Sentences:** 53 practice sentences

## Git Status

- **Branch:** main
- **Working tree:** Clean (uncommitted changes to `src/data/vocab.json`)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Recent Commits

1. dfe09b4 - Updated word in vocab.json
2. 11fad1e - Added cards per session config, reset options, dashboard stats
3. a82319e - Added localStorage persistence
4. efe15fa - Updated README (vibe coded)
5. 8e9265b - JSON data updated with new words/sentences
