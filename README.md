# English Flashcards

A modern, interactive flashcard application for learning English vocabulary and sentences — **entirely vibe coded** with AI-assisted development. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-%E2%9C%A8-blueviolet)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwind-css)

## What is Vibe Coding?

This project was **vibe coded** — a development approach where you describe what you want in natural language and an AI coding assistant writes the implementation. Instead of manually typing every line, the developer guided the direction, made design decisions, and iterated on features through conversation with AI. The result is a fully functional, production-ready application built through human-AI collaboration.

## Features

- **Dual Card Types**: Learn individual words or practice complete sentences
- **Spaced Repetition**: Smart scheduling system that shows cards based on your performance
- **Progress Tracking**: Visual dashboard with stats on mastered cards, pending reviews, and overall progress
- **Dark Mode**: Full dark mode support with smooth transitions
- **AI-Powered Hints**: Optional Gemini API integration for context-aware learning hints
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State**: React Context + useReducer for global state management

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/flashcards.git
cd flashcards
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Set up Gemini API for AI hints:

```bash
# Create a .env.local file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Dashboard

The main page displays your learning progress with statistics for total cards, mastered cards, pending reviews, and cards due for review.

### Study Mode

Practice your flashcards with the spaced repetition system. Cards are shown based on when they're due for review, helping you focus on what needs reinforcement.

### Manage Cards

Add new words or sentences, view existing cards, or delete cards you no longer need.

### Reset Progress

Start fresh by clearing all your learning progress while keeping your cards.

## Architecture

- **State Management**: All state is stored in-memory using React Context. No localStorage, no database - completely stateless.
- **Server Components**: The root layout is a server component for optimal performance.
- **Client Components**: Interactive pages use the `'use client'` directive.
- **API Routes**: Server-side Gemini API proxy at `/api/gemini`.

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/gemini/route.ts   # Server-side Gemini API proxy
    study/page.tsx        # Study session page
    manage/page.tsx       # Card management page
    reset/page.tsx        # Reset progress page
    page.tsx              # Dashboard (home)
    layout.tsx            # Root layout (server component)
  components/             # Reusable UI components
  context/                # React Context providers
  lib/                    # Utilities, types, seed data
```

## Deployment

The app is optimized for deployment on [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/flashcards)

Since all state is in-memory, the app is completely stateless and perfect for serverless deployment.

## License

MIT License - feel free to use this project for personal or educational purposes.

## Acknowledgments

- Vibe coded from start to finish using Claude as the AI coding assistant
- Spaced repetition algorithm inspired by proven learning techniques
- UI design follows accessibility best practices with full keyboard navigation support
