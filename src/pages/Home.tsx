import { AnimatePresence, motion } from 'framer-motion'
import { useHabits } from '../hooks/useHabits'
import { useHabitLogs } from '../hooks/useHabitLogs'
import { useHabitStore } from '../store/habitStore'
import HabitCard from '../components/habits/HabitCard'
import AddHabitModal from '../components/habits/AddHabitModal'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {
  const { data: habits = [], isLoading } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there'
      setUserName(name)
    })
  }, [])

  const goodHabits = habits.filter((h) => h.type === 'good')
  const badHabits = habits.filter((h) => h.type === 'bad')

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">My Habits</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back, {userName} 👋</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Good Habits */}
          {goodHabits.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <h2 className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">
                  Good Habits
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {goodHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      logs={logs}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Bad Habits */}
          {badHabits.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <h2 className="text-xs font-semibold text-rose-400 tracking-widest uppercase">
                  Breaking Bad Habits
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {badHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      logs={logs}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}

      <AddHabitModal />
    </div>
  )
}

function EmptyState() {
  const { setAddModalOpen } = useHabitStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="text-5xl mb-4">🌱</div>
      <h3 className="text-base font-semibold text-white mb-1">No habits yet</h3>
      <p className="text-sm text-slate-500 mb-5 max-w-xs">
        Start by adding a habit you want to build or break. Small steps every day.
      </p>
      <button
        onClick={() => setAddModalOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
      >
        Add your first habit
      </button>
    </motion.div>
  )
}
