# Habit Tracker

A portfolio-grade habit tracking PWA — GitHub-style contribution heatmaps, good/bad habit tracking, AI coaching, and seamless mobile + desktop experience.

---

## Features

- **GitHub-style heatmap** — Interactive 52-week contribution grid per habit, with 4-level intensity
- **Good habits** — log daily completions, track current + longest streaks
- **Bad habits** — track days clean since stopping; log slips
- **AI Habit Coach** — chat with GPT-4o mini; your live habit data is injected as context (RAG-lite)
- **NL habit creation** — describe a habit in plain English, AI extracts name/type/icon
- **Optimistic UI** — tap a heatmap cell → instant feedback, syncs to DB in background with rollback
- **PWA** — install to home screen on iOS/Android; offline-capable
- **Responsive** — bottom nav on mobile, sidebar on desktop

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Fast DX, strong typing, modern React |
| Styling | Tailwind CSS v4 | Utility-first, JIT dark theme |
| Global state | Zustand + Immer | Lightweight alt to Redux; optimistic UI layer |
| Data fetching | TanStack Query v5 | Cache, background sync, mutation rollback |
| Auth + DB | Supabase (PostgreSQL + RLS) | Auth, row-level security, real-time |
| AI | OpenAI GPT-4o mini via Supabase Edge Function | Server-side key, RAG-lite pattern |
| PWA | vite-plugin-pwa + Workbox | Auto-update, offline shell caching |
| Animations | Framer Motion | Streak animations, modal transitions |
| Date math | date-fns | Tree-shakeable, no moment.js bloat |

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│                                                      │
│  Pages: Home · Stats · Profile · Auth               │
│                                                      │
│  ┌──────────────┐   ┌──────────────────────────┐    │
│  │ Zustand Store│   │   TanStack Query Cache   │    │
│  │ (optimistic) │◄──│ useHabits / useHabitLogs │    │
│  └──────┬───────┘   └────────────┬─────────────┘    │
│         │                        │                   │
│  ┌──────▼────────────────────────▼─────────────┐    │
│  │            Algorithms (src/lib/)             │    │
│  │  streak.ts · heatmap.ts · stats.ts           │    │
│  └──────────────────────┬───────────────────────┘    │
└─────────────────────────│───────────────────────────┘
                          │ HTTP / Supabase JS SDK
              ┌───────────▼───────────┐
              │     Supabase          │
              │  ┌─────────────────┐  │
              │  │ Auth (JWT)      │  │
              │  ├─────────────────┤  │
              │  │ PostgreSQL      │  │
              │  │  habits         │  │
              │  │  habit_logs     │  │
              │  │  (+ RLS)        │  │
              │  ├─────────────────┤  │
              │  │ Edge Functions  │──┼──► OpenAI API
              │  │  habit-coach    │  │
              │  └─────────────────┘  │
              └───────────────────────┘
```

### State Architecture

Two layers of state work together for optimistic UI:

```
User taps heatmap cell
        │
        ▼
1. Zustand optimisticLogs[habitId].add(date)   ← instant UI update
        │
        ▼
2. TanStack Query mutation fires (Supabase insert/delete)
        │
   ┌────┴─────────┐
   │ success      │ error
   ▼              ▼
3. invalidate   rollback:
   query cache   clearOptimisticLogs(habitId)
   (TQ refetch)  (server state restored)
```

### Data Flow

```
Supabase DB
    │
    ▼
useHabitLogs() ──► TanStack Query cache (60s stale)
    │
    ▼
HabitCard ──► filters logs by habitId ──► passes to:
    ├── streak algorithms (calcCurrentStreak / calcBadHabitStreak)
    └── HeatmapGrid ──► buildHeatmap(logDates) ──► 52×7 cell grid
```

### AI Architecture (RAG-lite)

```
User types message in HabitCoach
        │
        ▼
buildContext() → formats live habit+streak data as text
        │
        ▼
POST /functions/v1/habit-coach
  { action: 'chat', messages: [...], context: "..." }
        │
        ▼
Edge Function (Deno):
  1. Prepend context to system prompt
  2. POST → OpenAI gpt-4o-mini
  3. Return { reply }
        │
        ▼
Chat UI renders response
```

---

## Database Schema

```sql
habits
  id           UUID PK
  user_id      UUID → auth.users
  name         TEXT
  type         TEXT  CHECK('good' | 'bad')
  icon         TEXT  (emoji)
  color        TEXT  (hex color)
  created_at   TIMESTAMPTZ
  archived_at  TIMESTAMPTZ  (NULL = active; soft delete)

habit_logs
  id           UUID PK
  habit_id     UUID → habits (CASCADE DELETE)
  user_id      UUID → auth.users
  logged_date  DATE
  created_at   TIMESTAMPTZ
  UNIQUE(habit_id, logged_date)   -- one log per day per habit
```

**Log semantics:**
- Good habit log = "I completed this on `logged_date`"
- Bad habit log = "I slipped on `logged_date`"

**RLS:** Every table has `SELECT / INSERT / UPDATE / DELETE` policies gating on `auth.uid() = user_id`.

---

## DSA Highlights

### Heatmap — O(n) build, O(1) lookup
`src/lib/algorithms/heatmap.ts`

```
1. Load all logged dates into a Set  → O(n), O(1) lookup
2. Sweep 364 days (52 weeks × 7)    → O(364) = O(1) constant
3. For each cell: Set.has(date)     → O(1)
Total: O(n) where n = number of logs
```

Intensity levels (1–4) determined by backward scan of consecutive days — same cell can visually encode streak momentum.

### Streak — LeetCode #128 pattern
`src/lib/algorithms/streak.ts`

```
calcCurrentStreak:  O(n) Set build + O(k) backward walk (k = streak length)
calcLongestStreak:  O(n log n) sort + O(n) single scan
calcBadHabitStreak: O(1) — days since last log entry
```

The Longest Consecutive Sequence pattern: sort the dates, walk forward counting consecutive differences of exactly 1 day.

### Stats — O(n) single pass
`src/lib/algorithms/stats.ts`

Groups logs by `habit_id` into a `Map` in one pass, then computes per-habit streaks to build the leaderboard. No redundant iterations.

---

## Project Structure

```
habit-tracker/
├── public/
│   └── icons/              PWA icons (192px, 512px)
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   └── HabitCoach.tsx       Chat panel + quick prompts
│   │   ├── habits/
│   │   │   ├── HabitCard.tsx        Card: heatmap + streak + log button
│   │   │   ├── HeatmapGrid.tsx      Interactive 52×7 contribution grid
│   │   │   ├── StreakBadge.tsx      Flame / shield badge
│   │   │   └── AddHabitModal.tsx    Form + AI natural language parser
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx        Mobile tab bar
│   │   │   └── Sidebar.tsx          Desktop sidebar
│   │   └── stats/
│   │       ├── StatCard.tsx         Single metric card
│   │       └── HabitLeaderboard.tsx Ranked habit list
│   ├── hooks/
│   │   ├── useHabits.ts             CRUD + TanStack Query
│   │   ├── useHabitLogs.ts          Toggle log + optimistic update
│   │   └── useStats.ts              Derived stats (no extra fetch)
│   ├── lib/
│   │   ├── algorithms/
│   │   │   ├── heatmap.ts           Heatmap grid builder
│   │   │   ├── streak.ts            Current + longest streak
│   │   │   └── stats.ts             Aggregate computations
│   │   └── supabase.ts              Client + type definitions
│   ├── pages/
│   │   ├── Home.tsx                 Habit list (Good / Breaking Bad)
│   │   ├── Stats.tsx                Dashboard + AI coach
│   │   ├── Profile.tsx              User info + settings
│   │   └── Auth.tsx                 Login / signup
│   ├── store/
│   │   └── habitStore.ts            Zustand: optimistic logs + UI state
│   ├── types/
│   │   └── index.ts                 Shared interfaces
│   └── App.tsx                      Auth guard + router + providers
├── supabase/
│   ├── functions/habit-coach/
│   │   └── index.ts                 Edge Function: OpenAI chat + NL parse
│   └── schema.sql                   Tables, indexes, RLS policies
├── vite.config.ts                   Vite + Tailwind + PWA config
└── .env.example                     Required environment variables
```

---

## Setup

### 1. Clone & install
```bash
git clone https://github.com/siavashahmadi/habit-tracker
cd habit-tracker
npm install
```

### 2. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Run `supabase/schema.sql` in the SQL editor
3. Copy URL + anon key from **Settings → API**

### 3. Environment variables
```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 4. Run locally
```bash
npm run dev   # http://localhost:5173
```

### 5. Docker deployment (optional)

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

docker compose up -d --build    # builds & starts on port 3000
curl http://localhost:3000      # verify it's running
```

The multi-stage build produces an ~30MB nginx image. Supabase env vars are baked into the JS bundle at build time (Vite `import.meta.env`), so rebuild when credentials change.

### 6. Deploy AI Edge Function (optional)
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set FRONTEND_URL=https://your-deployed-domain.com
supabase functions deploy habit-coach
```

> **Security note:** `FRONTEND_URL` restricts CORS to your deployed origin. The Edge Function also validates the caller's Supabase JWT on every request, so only authenticated users can invoke it.

---

## License

MIT
