import { Flame, ShieldCheck, Trophy } from 'lucide-react'
import type { Habit } from '../../types'

interface LeaderboardEntry {
  habit: Habit
  streak: number
}

interface HabitLeaderboardProps {
  entries: LeaderboardEntry[]
}

const RANK_STYLES = [
  'text-amber-400 bg-amber-400/15',
  'text-slate-400 bg-slate-700',
  'text-orange-600 bg-orange-600/15',
]

export default function HabitLeaderboard({ entries }: HabitLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">
        Add habits to see your leaderboard
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(({ habit, streak }, i) => {
        const isGood = habit.type === 'good'
        const rankStyle = RANK_STYLES[i] ?? 'text-slate-500 bg-slate-800'

        return (
          <div
            key={habit.id}
            className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2.5"
          >
            {/* Rank */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankStyle}`}
            >
              {i === 0 ? <Trophy className="w-3.5 h-3.5" /> : i + 1}
            </div>

            {/* Icon + Name */}
            <span className="text-lg flex-shrink-0">{habit.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{habit.name}</p>
              <p className={`text-[10px] font-medium ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isGood ? 'Good Habit' : 'Breaking Bad'}
              </p>
            </div>

            {/* Streak */}
            <div className={`flex items-center gap-1 text-sm font-semibold flex-shrink-0 ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isGood ? <Flame className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{streak}d</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
