import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ShieldOff, Loader2, Wand2 } from 'lucide-react'
import { useHabitStore } from '../../store/habitStore'
import { useCreateHabit } from '../../hooks/useHabits'
import type { HabitType } from '../../types'

const ICONS = ['💪', '📚', '🧘', '🏃', '💧', '🍎', '😴', '✍️', '🎯', '🧠', '🚫', '🚬', '🍔', '📱', '🍷', '💊']
const COLORS = [
  '#22c55e', // emerald
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

// AI-powered NL parsing (calls the Edge Function)
async function parseHabitFromNL(text: string): Promise<{ name: string; type: HabitType; icon: string } | null> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/habit-coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'parse_habit', text }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default function AddHabitModal() {
  const { isAddModalOpen, setAddModalOpen } = useHabitStore()
  const createHabit = useCreateHabit()

  const [name, setName] = useState('')
  const [type, setType] = useState<HabitType>('good')
  const [icon, setIcon] = useState('💪')
  const [color, setColor] = useState(COLORS[0])
  const [nlInput, setNlInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showNL, setShowNL] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  // M2: Store timeout id so we can cancel it on unmount
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (isAddModalOpen) {
      // M2: Track timeout so it can be cancelled if component unmounts
      focusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // Reset form
      setName('')
      setType('good')
      setIcon('💪')
      setColor(COLORS[0])
      setNlInput('')
      setAiError(null)
      setShowNL(false)
    }
  }, [isAddModalOpen])

  const handleAIParse = async () => {
    if (!nlInput.trim()) return
    setAiLoading(true)
    setAiError(null)
    const result = await parseHabitFromNL(nlInput.trim())
    setAiLoading(false)
    if (result) {
      setName(result.name)
      setType(result.type)
      setIcon(result.icon)
      setShowNL(false)
    } else {
      // H6: Show error feedback when AI can't parse the description
      setAiError("Couldn't extract a habit. Try being more specific, e.g. 'Stop drinking coffee' or 'Exercise every morning'.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await createHabit.mutateAsync({ name: name.trim(), type, icon, color })
    setAddModalOpen(false)
  }

  return (
    <AnimatePresence>
      {isAddModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-auto px-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-white">Add New Habit</h2>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AI Natural Language Toggle */}
              <button
                onClick={() => setShowNL(!showNL)}
                className="w-full flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 mb-4 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {showNL ? 'Enter details manually' : 'Use AI to create from description'}
              </button>

              <AnimatePresence mode="wait">
                {showNL ? (
                  <motion.div
                    key="nl"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Describe your habit
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={nlInput}
                        onChange={(e) => setNlInput(e.target.value)}
                        placeholder="e.g. I want to stop eating junk food"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleAIParse()}
                      />
                      <button
                        onClick={handleAIParse}
                        disabled={aiLoading || !nlInput.trim()}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {aiError && (
                      <p className="mt-1.5 text-xs text-rose-400">{aiError}</p>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Habit Name
                  </label>
                  <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Morning workout"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Habit Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setType('good'); setColor(COLORS[0]) }}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                        type === 'good'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Good Habit</span>
                      <span className="text-[10px] opacity-70">Build it up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('bad'); setColor('#ef4444') }}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                        type === 'bad'
                          ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <ShieldOff className="w-4 h-4" />
                      <span>Bad Habit</span>
                      <span className="text-[10px] opacity-70">Break it down</span>
                    </button>
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Icon</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {ICONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setIcon(em)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                          icon === em
                            ? 'bg-slate-600 ring-1 ring-white/30 scale-110'
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                {type === 'good' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
                    <div className="flex gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            color === c ? 'scale-125 ring-2 ring-white/40' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!name.trim() || createHabit.isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {createHabit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  + Add Habit
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
