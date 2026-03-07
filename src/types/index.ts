export type HabitType = 'good' | 'bad'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  icon: string
  color: string
  created_at: string
  archived_at: string | null
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  logged_date: string // ISO date string YYYY-MM-DD
  created_at: string
}

export interface HeatmapCell {
  date: string       // YYYY-MM-DD
  filled: boolean
  level: 0 | 1 | 2 | 3 | 4  // 0 = empty, 1-4 = intensity (for good habits)
  isToday: boolean
  isFuture: boolean
}

export interface HabitWithStats extends Habit {
  logs: HabitLog[]
  currentStreak: number
  longestStreak: number
  totalLogs: number
  heatmap: HeatmapCell[][]
}

export interface AppStats {
  totalHabits: number
  goodHabits: number
  badHabits: number
  totalCompletions: number
  longestStreak: number
  averageStreak: number
  leaderboard: { habit: Habit; streak: number }[]
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}
