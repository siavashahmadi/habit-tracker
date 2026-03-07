import { format, subDays, parseISO, differenceInDays } from 'date-fns'

/**
 * Calculate the current streak for a GOOD habit.
 * A streak is the number of consecutive days with a log entry, ending today (or yesterday).
 * Algorithm: O(n log n) sort + O(n) backward scan.
 * Similar to LeetCode #128 (Longest Consecutive Sequence) but date-ordered.
 */
export function calcCurrentStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0

  const dateSet = new Set(logDates)
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Streak must include today or yesterday to be "current"
  if (!dateSet.has(today) && !dateSet.has(yesterday)) return 0

  let streak = 0
  let cursor = dateSet.has(today) ? new Date() : subDays(new Date(), 1)

  while (true) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (!dateSet.has(dateStr)) break
    streak++
    cursor = subDays(cursor, 1)
  }

  return streak
}

/**
 * Calculate the longest streak ever for a GOOD habit.
 * Algorithm: sort → single O(n) pass counting consecutive sequences.
 */
export function calcLongestStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0

  const sorted = [...logDates].sort()
  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1])
    const curr = parseISO(sorted[i])
    const diff = differenceInDays(curr, prev)

    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else if (diff > 1) {
      current = 1
    }
    // diff === 0 means duplicate date, skip
  }

  return longest
}

/**
 * Calculate the current "clean streak" for a BAD habit.
 * A clean streak = days since the last slip log (or since habit creation if no slips).
 */
export function calcBadHabitStreak(logDates: string[], createdAt: string): number {
  if (logDates.length === 0) {
    // No slips — count from creation date
    const created = parseISO(createdAt)
    return differenceInDays(new Date(), created)
  }

  const sorted = [...logDates].sort()
  const lastSlip = parseISO(sorted[sorted.length - 1])
  return differenceInDays(new Date(), lastSlip)
}
