import { useMemo } from 'react'
import { useHabits } from './useHabits'
import { useHabitLogs } from './useHabitLogs'
import { computeStats } from '../lib/algorithms/stats'
import type { AppStats } from '../types'

/**
 * Derives aggregate statistics from cached habits + logs.
 * No extra network call — piggybacks on existing TanStack Query caches.
 * Memoized so it only recomputes when habits or logs change.
 */
export function useStats(): { stats: AppStats; isLoading: boolean } {
  const { data: habits = [], isLoading: habitsLoading } = useHabits()
  const { data: logs = [], isLoading: logsLoading } = useHabitLogs()

  const stats = useMemo(() => computeStats(habits, logs), [habits, logs])

  return {
    stats,
    isLoading: habitsLoading || logsLoading,
  }
}
