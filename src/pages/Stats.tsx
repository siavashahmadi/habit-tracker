import { Target, TrendingUp, Award, Calendar } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import StatCard from '../components/stats/StatCard'
import HabitLeaderboard from '../components/stats/HabitLeaderboard'
import HabitCoach from '../components/ai/HabitCoach'

export default function Stats() {
  const { stats, isLoading } = useStats()

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  const maxStreak = Math.max(stats.longestStreak, 1)

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Your Stats</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track your progress over time</p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Target className="w-4 h-4 text-blue-400" />}
          value={stats.totalHabits}
          label="Total Habits"
          accent="text-white"
          iconBg="bg-blue-500/15"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          value={stats.goodHabits}
          label="Good Habits"
          accent="text-emerald-400"
          iconBg="bg-emerald-500/15"
        />
        <StatCard
          icon={<Award className="w-4 h-4 text-rose-400" />}
          value={stats.badHabits}
          label="Breaking Bad"
          accent="text-rose-400"
          iconBg="bg-rose-500/15"
        />
        <StatCard
          icon={<Calendar className="w-4 h-4 text-purple-400" />}
          value={`${stats.longestStreak}d`}
          label="Longest Streak"
          accent="text-purple-400"
          iconBg="bg-purple-500/15"
        />
      </div>

      {/* Average Streak */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-1">Average Streak</h3>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold text-white">{stats.averageStreak}</span>
          <span className="text-sm text-slate-400">days</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((stats.averageStreak / maxStreak) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Habit Leaderboard</h3>
        <HabitLeaderboard entries={stats.leaderboard} />
      </div>

      {/* AI Coach */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">AI Habit Coach</h3>
        <HabitCoach />
      </div>
    </div>
  )
}
