import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { buildHeatmap, getRecentWeeks } from '../../lib/algorithms/heatmap'
import { useToggleLog } from '../../hooks/useHabitLogs'
import { useHabitStore } from '../../store/habitStore'
import type { HabitType, HabitLog } from '../../types'

interface HeatmapGridProps {
  habitId: string
  habitType: HabitType
  habitColor: string
  logs: HabitLog[]
  compact?: boolean        // true = show last 16 weeks (mobile card)
  interactive?: boolean    // allow tapping cells
}

/**
 * GitHub-style contribution heatmap.
 *
 * Data structure: 2D array [week][day] built in O(n) using a hash set.
 * Cells are sized responsively and colored based on habit type + intensity.
 */
export default function HeatmapGrid({
  habitId,
  habitType,
  habitColor,
  logs,
  compact = false,
  interactive = true,
}: HeatmapGridProps) {
  const toggleLog = useToggleLog()
  const { isOptimisticallyLogged } = useHabitStore()

  const logDates = logs.map((l) => l.logged_date)

  const grid = useMemo(
    () => buildHeatmap(logDates, habitType),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logDates.join(','), habitType]
  )

  const visibleGrid = compact ? getRecentWeeks(grid, 16) : grid

  const getCellColor = (filled: boolean, level: number, isFuture: boolean) => {
    if (isFuture) return 'bg-slate-800/40'
    if (!filled) return 'bg-slate-800 hover:bg-slate-700'

    if (habitType === 'good') {
      if (level === 4) return '' // full color, handled via inline style
      return `bg-emerald-${level === 1 ? '500/40' : level === 2 ? '500/60' : '500/80'}`
    } else {
      // Bad habit slip — red
      const intensities: Record<number, string> = {
        1: 'bg-rose-500/40',
        2: 'bg-rose-500/60',
        3: 'bg-rose-500/80',
        4: 'bg-rose-500',
      }
      return intensities[level] ?? 'bg-rose-500/40'
    }
  }

  const handleCellClick = (date: string, isFuture: boolean) => {
    if (!interactive || isFuture) return
    // Only allow logging today (+ past days for corrections)
    const currentlyLogged = isOptimisticallyLogged(habitId, date, logs)
    toggleLog.mutate({ habitId, date, currentlyLogged })
  }

  const cellSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const gap = compact ? 'gap-0.5' : 'gap-1'

  return (
    <div className={`flex ${gap} overflow-x-auto no-scrollbar`}>
      {visibleGrid.map((week, wi) => (
        <div key={wi} className={`flex flex-col ${gap}`}>
          {week.map((cell) => {
            const isOptLogged = isOptimisticallyLogged(habitId, cell.date, logs)
            const displayFilled = isOptLogged

            const bgClass = getCellColor(displayFilled, cell.level, cell.isFuture)
            const useInlineColor =
              displayFilled && habitType === 'good' && cell.level === 4

            return (
              <motion.button
                key={cell.date}
                whileTap={interactive && !cell.isFuture ? { scale: 0.75 } : undefined}
                title={`${format(parseISO(cell.date), 'MMM d, yyyy')}${displayFilled ? ' ✓' : ''}`}
                onClick={() => handleCellClick(cell.date, cell.isFuture)}
                disabled={!interactive || cell.isFuture}
                className={`${cellSize} rounded-sm transition-all duration-150 ${bgClass} ${
                  cell.isToday ? 'ring-1 ring-white/30' : ''
                } ${interactive && !cell.isFuture ? 'cursor-pointer' : 'cursor-default'}`}
                style={
                  useInlineColor
                    ? { backgroundColor: habitColor }
                    : undefined
                }
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
