import { Flame, ShieldCheck } from 'lucide-react'
import type { HabitType } from '../../types'
import { getHighestMilestoneAchieved } from '../../lib/milestones'

interface StreakBadgeProps {
  streak: number
  type: HabitType
  size?: 'sm' | 'md'
}

export default function StreakBadge({ streak, type, size = 'md' }: StreakBadgeProps) {
  const isGood = type === 'good'
  const label = isGood ? `${streak} Day Streak` : `${streak} Days Clean`
  const milestone = getHighestMilestoneAchieved(streak)

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isGood
            ? 'text-emerald-400 bg-emerald-400/10'
            : 'text-rose-400 bg-rose-400/10'
        }`}
      >
        {isGood ? (
          <Flame className="w-3 h-3" />
        ) : (
          <ShieldCheck className="w-3 h-3" />
        )}
        {streak}d
      </span>
    )
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-sm font-semibold ${
        isGood ? 'text-emerald-400' : 'text-rose-400'
      }`}
    >
      {isGood ? (
        <Flame className={`w-4 h-4 ${milestone ? 'drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]' : ''}`} />
      ) : (
        <ShieldCheck className={`w-4 h-4 ${milestone ? 'drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]' : ''}`} />
      )}
      <span className={milestone ? 'text-amber-300' : ''}>{label}</span>
      {milestone && (
        <span className="text-xs text-slate-500 font-normal">· {milestone.label}</span>
      )}
    </div>
  )
}
