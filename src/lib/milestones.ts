/**
 * Milestone definitions and detection for the habit streak celebration system.
 *
 * A milestone is crossed when the streak transitions from below the threshold
 * to at or above it in a single increment (i.e. prev < N <= next).
 * This prevents re-firing on page reload.
 */

export interface Milestone {
  days: number
  label: string
  emoji: string
  /** Confetti intensity: 1 = subtle, 2 = medium, 3 = full send */
  intensity: 1 | 2 | 3
}

export const MILESTONES: Milestone[] = [
  { days: 3,   label: '3-Day Streak',    emoji: '🔥', intensity: 1 },
  { days: 7,   label: '1-Week Streak',   emoji: '⚡', intensity: 2 },
  { days: 14,  label: '2-Week Streak',   emoji: '💪', intensity: 2 },
  { days: 30,  label: '1-Month Streak',  emoji: '🏆', intensity: 3 },
  { days: 60,  label: '2-Month Streak',  emoji: '🌟', intensity: 3 },
  { days: 100, label: '100-Day Streak',  emoji: '💎', intensity: 3 },
  { days: 365, label: '1-Year Streak',   emoji: '👑', intensity: 3 },
]

/**
 * Returns the milestone crossed when streak moves from `prev` to `next`.
 * Returns null if no milestone was crossed.
 *
 * Time complexity: O(m) where m = number of milestones (constant, m ≤ 7)
 */
export function getMilestoneCrossed(prev: number, next: number): Milestone | null {
  if (next <= prev) return null
  // Find the highest milestone crossed in this increment (handles jumps)
  let crossed: Milestone | null = null
  for (const milestone of MILESTONES) {
    if (prev < milestone.days && next >= milestone.days) {
      crossed = milestone
    }
  }
  return crossed
}

/**
 * Returns the highest milestone already achieved for a given streak.
 * Used to show a persistent badge on the habit card.
 */
export function getHighestMilestoneAchieved(streak: number): Milestone | null {
  let highest: Milestone | null = null
  for (const milestone of MILESTONES) {
    if (streak >= milestone.days) highest = milestone
  }
  return highest
}
