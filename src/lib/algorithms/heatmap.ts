import { format, subDays, startOfWeek, addDays, isToday, isFuture, parseISO } from 'date-fns'
import type { HeatmapCell } from '../../types'

const WEEKS = 52

/**
 * Build the 52-week heatmap grid for a habit.
 *
 * Algorithm:
 * 1. Load all logged dates into a Set → O(n) build, O(1) lookup
 * 2. Sweep 364 days from oldest to newest → O(364) = O(1) constant
 *
 * Returns a 2D array: heatmap[week][dayOfWeek]
 * week 0 = oldest, week 51 = current week
 * dayOfWeek 0 = Sunday, 6 = Saturday
 *
 * @param logDates  - ISO date strings for logged days
 * @param habitType - 'good' or 'bad'; affects cell coloring semantics
 */
export function buildHeatmap(logDates: string[], _habitType: 'good' | 'bad'): HeatmapCell[][] {
  const logSet = new Set(logDates)

  // Find the start of the grid: 52 weeks ago, aligned to Sunday
  const today = new Date()
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 })
  const gridStart = subDays(currentWeekStart, (WEEKS - 1) * 7)

  const grid: HeatmapCell[][] = []

  for (let w = 0; w < WEEKS; w++) {
    const week: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d)
      const dateStr = format(date, 'yyyy-MM-dd')
      const filled = logSet.has(dateStr)
      const future = isFuture(date) && !isToday(date)

      week.push({
        date: dateStr,
        filled,
        level: filled ? getIntensityLevel(dateStr, logSet) : 0,
        isToday: isToday(date),
        isFuture: future,
      })
    }
    grid.push(week)
  }

  return grid
}

/**
 * Determine intensity level (1–4) based on surrounding activity.
 * A cell earns higher intensity if it's part of a longer streak.
 * Levels: 1=isolated, 2=2-day, 3=3-day, 4=4+ day streak
 */
function getIntensityLevel(dateStr: string, logSet: Set<string>): 1 | 2 | 3 | 4 {
  const date = parseISO(dateStr)
  let consecutive = 1

  // Look back up to 3 days
  for (let i = 1; i <= 3; i++) {
    if (logSet.has(format(subDays(date, i), 'yyyy-MM-dd'))) {
      consecutive++
    } else {
      break
    }
  }

  if (consecutive >= 4) return 4
  if (consecutive === 3) return 3
  if (consecutive === 2) return 2
  return 1
}

/**
 * Flatten heatmap grid to a 1D array of cells for rendering as a compact row strip.
 * Used in the mobile HabitCard compact view.
 */
export function flattenHeatmap(grid: HeatmapCell[][]): HeatmapCell[] {
  return grid.flat()
}

/**
 * Get just the last N weeks of the heatmap for compact card display.
 */
export function getRecentWeeks(grid: HeatmapCell[][], weeks: number): HeatmapCell[][] {
  return grid.slice(Math.max(0, grid.length - weeks))
}
