import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { HabitLog } from '../types'

/**
 * Zustand store for optimistic UI updates.
 * When a user taps a habit cell, we update local state immediately
 * while TanStack Query syncs to Supabase in the background.
 * On error, TanStack Query invalidates the cache and rolls back.
 *
 * NOTE: Uses string[] instead of Set<string> because Immer does not
 * track Set mutations reliably, causing silent re-render failures.
 */
interface HabitStore {
  // Optimistic log overrides: habitId -> array of dateStrings
  optimisticLogs: Record<string, string[]>
  // UI state
  selectedHabitId: string | null
  isAddModalOpen: boolean
  viewMode: 'grid' | 'list'

  // Actions
  setOptimisticLog: (habitId: string, date: string, logged: boolean) => void
  clearOptimisticLogs: (habitId: string) => void
  rollbackOptimisticLog: (habitId: string, date: string) => void
  setSelectedHabit: (id: string | null) => void
  setAddModalOpen: (open: boolean) => void
  setViewMode: (mode: 'grid' | 'list') => void
  isOptimisticallyLogged: (habitId: string, date: string, serverLogs: HabitLog[]) => boolean
}

// Detect and validate persisted view mode preference
const _savedViewMode = localStorage.getItem('viewMode')
const savedViewMode: 'grid' | 'list' =
  _savedViewMode === 'grid' || _savedViewMode === 'list' ? _savedViewMode : 'grid'

export const useHabitStore = create<HabitStore>()(
  immer((set, get) => ({
    optimisticLogs: {},
    selectedHabitId: null,
    isAddModalOpen: false,
    viewMode: savedViewMode,

    setOptimisticLog: (habitId, date, logged) => {
      set((state) => {
        if (!state.optimisticLogs[habitId]) {
          state.optimisticLogs[habitId] = []
        }
        const arr = state.optimisticLogs[habitId]
        if (logged) {
          if (!arr.includes(date)) arr.push(date)
        } else {
          state.optimisticLogs[habitId] = arr.filter((d) => d !== date)
        }
      })
    },

    clearOptimisticLogs: (habitId) => {
      set((state) => {
        delete state.optimisticLogs[habitId]
      })
    },

    // C4: Roll back only the specific date that failed, not all optimistic logs
    rollbackOptimisticLog: (habitId, date) => {
      set((state) => {
        if (state.optimisticLogs[habitId]) {
          state.optimisticLogs[habitId] = state.optimisticLogs[habitId].filter((d) => d !== date)
        }
      })
    },

    setSelectedHabit: (id) => set({ selectedHabitId: id }),

    setAddModalOpen: (open) => set({ isAddModalOpen: open }),

    setViewMode: (mode) => {
      try {
        localStorage.setItem('viewMode', mode)
      } catch {
        // Private browsing / storage quota — silently ignore
      }
      set({ viewMode: mode })
    },

    isOptimisticallyLogged: (habitId, date, serverLogs) => {
      const optimistic = get().optimisticLogs[habitId]
      if (optimistic && optimistic.length > 0) {
        // Optimistic override takes precedence
        return optimistic.includes(date)
      }
      // Fall back to server data
      return serverLogs.some((log) => log.habit_id === habitId && log.logged_date === date)
    },
  }))
)
