# Habit Tracker

A full-stack, portfolio-grade habit tracking PWA built with React + TypeScript, Supabase, and AI features. Works seamlessly on mobile and desktop.

## Features

- **GitHub-style heatmap** — 52-week contribution grid for each habit
- **Good habits** — log daily completions, track streaks and consistency
- **Bad habits** — track days clean since stopping, log any slips
- **AI Habit Coach** — chat with GPT-4o mini about your habit patterns (RAG-lite: injects your live data as context)
- **NL habit creation** — describe a habit in plain English, AI fills in the form
- **Optimistic UI** — tapping a cell updates instantly, syncs to DB in background
- **PWA** — install to home screen on iOS/Android, works offline
- **Responsive** — bottom nav on mobile, sidebar on desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS (dark theme) |
| State | Zustand (optimistic updates) |
| Data fetching | TanStack Query (caching + background sync) |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| AI | OpenAI GPT-4o mini via Supabase Edge Function |
| PWA | vite-plugin-pwa + Workbox |
| Animations | Framer Motion |

## DSA Highlights

- **Heatmap**: O(n) build using a date→boolean `Set` for O(1) lookups across 52 × 7 = 364 cells
- **Streak calculation**: Sort + single O(n) scan — same pattern as LeetCode #128 (Longest Consecutive Sequence)
- **Stats aggregation**: Single-pass O(n) computation across all habits/logs
- **Optimistic UI**: Zustand override layer sits in front of TanStack Query server state, with automatic rollback on error

## Setup

### 1. Clone & install

```bash
git clone https://github.com/yourusername/habit-tracker
cd habit-tracker
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run `supabase/schema.sql` to create tables + RLS policies
3. Copy your project URL and anon key from **Settings → API**

### 3. Set up environment variables

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 4. Run locally

```bash
npm run dev
# Opens at http://localhost:5173
```

### 5. (Optional) Deploy the AI Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

supabase login
supabase link --project-ref your-project-id
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy habit-coach
```

## Project Structure

```
src/
├── components/
│   ├── ai/           HabitCoach (AI chat panel)
│   ├── habits/       HabitCard, HeatmapGrid, StreakBadge, AddHabitModal
│   ├── layout/       BottomNav (mobile), Sidebar (desktop)
│   └── stats/        StatCard, HabitLeaderboard
├── hooks/            useHabits, useHabitLogs, useStats
├── lib/
│   ├── algorithms/   streak.ts, heatmap.ts, stats.ts
│   └── supabase.ts
├── pages/            Home, Stats, Profile, Auth
├── store/            habitStore.ts (Zustand)
└── types/            index.ts
supabase/
├── functions/habit-coach/   Edge Function (OpenAI)
└── schema.sql               DB schema + RLS policies
```

## License

MIT
