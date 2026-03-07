import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Habit } from '../types'

export const HABITS_KEY = ['habits'] as const

async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: fetchHabits,
    staleTime: 60_000,
  })
}

// ---- Create ----
interface CreateHabitInput {
  name: string
  type: 'good' | 'bad'
  icon: string
  color: string
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('habits')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

// ---- Delete (soft archive) ----
export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', habitId)

      if (error) throw error
    },
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY })
      const prev = queryClient.getQueryData<Habit[]>(HABITS_KEY)
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        (old ?? []).filter((h) => h.id !== habitId)
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(HABITS_KEY, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}
