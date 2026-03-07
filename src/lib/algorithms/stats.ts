import type { Habit, HabitLog, AppStats } from '../../types'
import { calcCurrentStreak, calcBadHabitStreak, calcLongestStreak } from './streak'

/**
 * Compute aggregate stats across all habits.
 * Single-pass O(n) aggregation where n = total log count.
 */
export function computeStats(habits: Habit[], logs: HabitLog[]): AppStats {
  if (habits.length === 0) {
    return {
      totalHabits: 0,
      goodHabits: 0,
      badHabits: 0,
      totalCompletions: 0,
      longestStreak: 0,
      averageStreak: 0,
      leaderboard: [],
    }
  }

  // Group logs by habit_id using a Map → O(n)
  const logsByHabit = new Map<string, string[]>()
  for (const habit of habits) {
    logsByHabit.set(habit.id, [])
  }
  for (const log of logs) {
    const existing = logsByHabit.get(log.habit_id)
    if (existing) existing.push(log.logged_date)
  }

  // Compute per-habit streaks → O(h * k) where h=habits, k=avg logs per habit
  const habitStreaks: { habit: Habit; streak: number }[] = habits.map((habit) => {
    const habitLogs = logsByHabit.get(habit.id) ?? []
    const streak =
      habit.type === 'good'
        ? calcCurrentStreak(habitLogs)
        : calcBadHabitStreak(habitLogs, habit.created_at)
    return { habit, streak }
  })

  const streaks = habitStreaks.map((h) => h.streak)
  const longestStreak = Math.max(
    ...habits.map((h) => calcLongestStreak(logsByHabit.get(h.id) ?? [])),
    0
  )
  const averageStreak =
    streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0

  // Sort leaderboard by streak descending
  const leaderboard = [...habitStreaks].sort((a, b) => b.streak - a.streak)

  return {
    totalHabits: habits.length,
    goodHabits: habits.filter((h) => h.type === 'good').length,
    badHabits: habits.filter((h) => h.type === 'bad').length,
    totalCompletions: logs.length,
    longestStreak,
    averageStreak,
    leaderboard,
  }
}
