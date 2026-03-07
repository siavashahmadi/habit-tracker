import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useHabitStore } from '../store/habitStore'
import type { HabitLog } from '../types'

export const LOGS_KEY = ['habit_logs'] as const

async function fetchAllLogs(): Promise<HabitLog[]> {
  // M4: Limit to 1 year of data — avoids unbounded query for long-time users
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .gte('logged_date', cutoffStr)
    .order('logged_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function useHabitLogs() {
  return useQuery({
    queryKey: LOGS_KEY,
    queryFn: fetchAllLogs,
    staleTime: 60_000,
  })
}

/** Returns logs for a single habit */
export function useLogsForHabit(habitId: string): string[] {
  const { data: logs = [] } = useHabitLogs()
  return logs.filter((l) => l.habit_id === habitId).map((l) => l.logged_date)
}

// ---- Toggle log (optimistic) ----
export function useToggleLog() {
  const queryClient = useQueryClient()
  const { setOptimisticLog, clearOptimisticLogs } = useHabitStore()

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      currentlyLogged,
    }: {
      habitId: string
      date: string
      currentlyLogged: boolean
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (currentlyLogged) {
        // Remove log
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('logged_date', date)
        if (error) throw error
      } else {
        // Add log
        const { error } = await supabase
          .from('habit_logs')
          .insert({ habit_id: habitId, user_id: user.id, logged_date: date })
        if (error) throw error
      }
    },

    onMutate: async ({ habitId, date, currentlyLogged }) => {
      // Optimistic update: flip the state immediately
      setOptimisticLog(habitId, date, !currentlyLogged)
    },

    onError: (_err, { habitId }) => {
      // Roll back optimistic update
      clearOptimisticLogs(habitId)
    },

    onSettled: (_data, _err, { habitId }) => {
      clearOptimisticLogs(habitId)
      queryClient.invalidateQueries({ queryKey: LOGS_KEY })
    },
  })
}

/** Log today's habit (convenience wrapper for the + button) */
export function useLogToday() {
  const toggleLog = useToggleLog()
  const { data: logs = [] } = useHabitLogs()

  return {
    logToday: (habitId: string) => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const currentlyLogged = logs.some(
        (l) => l.habit_id === habitId && l.logged_date === today
      )
      toggleLog.mutate({ habitId, date: today, currentlyLogged })
    },
    isPending: toggleLog.isPending,
  }
}
