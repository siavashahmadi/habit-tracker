import type { HabitType } from '../types'

export type StreakLevelName = 'none' | 'ember' | 'spark' | 'blaze' | 'inferno' | 'legendary'

export interface StreakLevel {
  level: number
  name: StreakLevelName
}

const LEVELS: { threshold: number; level: number; name: StreakLevelName }[] = [
  { threshold: 100, level: 5, name: 'legendary' },
  { threshold: 30,  level: 4, name: 'inferno' },
  { threshold: 14,  level: 3, name: 'blaze' },
  { threshold: 7,   level: 2, name: 'spark' },
  { threshold: 3,   level: 1, name: 'ember' },
]

export function getStreakLevel(streak: number): StreakLevel {
  for (const { threshold, level, name } of LEVELS) {
    if (streak >= threshold) return { level, name }
  }
  return { level: 0, name: 'none' }
}

export function getStreakLevelNumber(streak: number): number {
  if (streak >= 100) return 5
  if (streak >= 30) return 4
  if (streak >= 14) return 3
  if (streak >= 7) return 2
  if (streak >= 3) return 1
  return 0
}

const BAD_HABIT_COLOR = '#f43f5e'

export function getGlowColor(habitColor: string, habitType: HabitType, opacity: number): string {
  const hex = habitType === 'bad' ? BAD_HABIT_COLOR : habitColor
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
