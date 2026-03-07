import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react'
import { format } from 'date-fns'
import StreakBadge from './StreakBadge'
import HeatmapGrid from './HeatmapGrid'
import { useDeleteHabit } from '../../hooks/useHabits'
import { useLogToday } from '../../hooks/useHabitLogs'
import { calcCurrentStreak, calcBadHabitStreak } from '../../lib/algorithms/streak'
import type { Habit, HabitLog } from '../../types'

interface HabitCardProps {
  habit: Habit
  logs: HabitLog[]
  viewMode?: 'grid' | 'list'
}

export default function HabitCard({ habit, logs, viewMode = 'grid' }: HabitCardProps) {
  const [expanded, setExpanded] = useState(false)
  const deleteHabit = useDeleteHabit()
  const { logToday, isPending } = useLogToday()

  const logDates = logs.filter((l) => l.habit_id === habit.id).map((l) => l.logged_date)
  const habitLogs = logs.filter((l) => l.habit_id === habit.id)

  const streak =
    habit.type === 'good'
      ? calcCurrentStreak(logDates)
      : calcBadHabitStreak(logDates, habit.created_at)

  const today = format(new Date(), 'yyyy-MM-dd')
  const loggedToday = logDates.includes(today)

  const isGood = habit.type === 'good'

  const handleDelete = async () => {
    if (confirm(`Delete "${habit.name}"? This cannot be undone.`)) {
      deleteHabit.mutate(habit.id)
    }
  }

  // In list mode show expanded view by default
  const showFullHeatmap = viewMode === 'list' || expanded

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{habit.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">
              {habit.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isGood ? 'Good Habit' : 'Breaking Bad Habit'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Log today button — only for good habits */}
          {isGood && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => logToday(habit.id)}
              disabled={isPending}
              title={loggedToday ? 'Mark incomplete' : 'Mark complete'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                loggedToday
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-emerald-400'
              }`}
            >
              {loggedToday ? (
                <Check className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              )}
            </motion.button>
          )}

          {/* Expand toggle on mobile */}
          {viewMode === 'grid' && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Streak */}
      <div className="mb-3">
        <StreakBadge streak={streak} type={habit.type} />
      </div>

      {/* Heatmap — compact by default, full when expanded */}
      <div className="overflow-hidden">
        <HeatmapGrid
          habitId={habit.id}
          habitType={habit.type}
          habitColor={habit.color}
          logs={habitLogs}
          compact={!showFullHeatmap}
          interactive
        />
      </div>

      {/* Expanded detail (list view or expanded card) */}
      <AnimatePresence>
        {showFullHeatmap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500"
          >
            <span>Started {format(new Date(habit.created_at), 'MMM d, yyyy')}</span>
            <span>{logDates.length} total logs</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
