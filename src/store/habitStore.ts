import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { HabitLog } from '../types'

/**
 * Zustand store for optimistic UI updates.
 * When a user taps a habit cell, we update local state immediately
 * while TanStack Query syncs to Supabase in the background.
 * On error, TanStack Query invalidates the cache and rolls back.
 */
interface HabitStore {
  // Optimistic log overrides: habitId -> Set of dateStrings
  optimisticLogs: Record<string, Set<string>>
  // UI state
  selectedHabitId: string | null
  isAddModalOpen: boolean
  viewMode: 'grid' | 'list'

  // Actions
  setOptimisticLog: (habitId: string, date: string, logged: boolean) => void
  clearOptimisticLogs: (habitId: string) => void
  setSelectedHabit: (id: string | null) => void
  setAddModalOpen: (open: boolean) => void
  setViewMode: (mode: 'grid' | 'list') => void
  isOptimisticallyLogged: (habitId: string, date: string, serverLogs: HabitLog[]) => boolean
}

// Detect persisted view mode preference
const savedViewMode = (localStorage.getItem('viewMode') as 'grid' | 'list') ?? 'grid'

export const useHabitStore = create<HabitStore>()(
  immer((set, get) => ({
    optimisticLogs: {},
    selectedHabitId: null,
    isAddModalOpen: false,
    viewMode: savedViewMode,

    setOptimisticLog: (habitId, date, logged) => {
      set((state) => {
        if (!state.optimisticLogs[habitId]) {
          state.optimisticLogs[habitId] = new Set()
        }
        if (logged) {
          state.optimisticLogs[habitId].add(date)
        } else {
          state.optimisticLogs[habitId].delete(date)
        }
      })
    },

    clearOptimisticLogs: (habitId) => {
      set((state) => {
        delete state.optimisticLogs[habitId]
      })
    },

    setSelectedHabit: (id) => set({ selectedHabitId: id }),

    setAddModalOpen: (open) => set({ isAddModalOpen: open }),

    setViewMode: (mode) => {
      localStorage.setItem('viewMode', mode)
      set({ viewMode: mode })
    },

    isOptimisticallyLogged: (habitId, date, serverLogs) => {
      const optimistic = get().optimisticLogs[habitId]
      if (optimistic) {
        // Optimistic override takes precedence
        return optimistic.has(date)
      }
      // Fall back to server data
      return serverLogs.some((log) => log.habit_id === habitId && log.logged_date === date)
    },
  }))
)
