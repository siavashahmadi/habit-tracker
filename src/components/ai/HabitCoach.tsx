import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, Sparkles, User } from 'lucide-react'
import { useHabits } from '../../hooks/useHabits'
import { useHabitLogs } from '../../hooks/useHabitLogs'
import { calcCurrentStreak, calcBadHabitStreak } from '../../lib/algorithms/streak'
import type { AIMessage } from '../../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const QUICK_PROMPTS = [
  'How am I doing overall?',
  'Which habit needs the most attention?',
  'Give me tips for my weakest habit',
  'What patterns do you see in my data?',
]

/**
 * AI Habit Coach - a RAG-lite chat panel.
 * Injects the user's live habit + streak data as context into each prompt,
 * then sends to a Supabase Edge Function that calls OpenAI gpt-4o-mini.
 *
 * Architecture mirrors the LLM+RAG chatbot pattern from the Joulea experience.
 */
export default function HabitCoach() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI habit coach. Ask me anything about your habits, streaks, or how to stay consistent. 💪",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build a compact habit summary to inject as context (RAG-lite pattern)
  const buildContext = () => {
    return habits.map((habit) => {
      const habitLogs = logs
        .filter((l) => l.habit_id === habit.id)
        .map((l) => l.logged_date)

      const streak =
        habit.type === 'good'
          ? calcCurrentStreak(habitLogs)
          : calcBadHabitStreak(habitLogs, habit.created_at)

      return `- ${habit.name} (${habit.type} habit): ${streak} day streak, ${habitLogs.length} total logs`
    }).join('\n')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: AIMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const context = buildContext()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/habit-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'chat',
          messages: [...messages, userMessage],
          context,
        }),
      })

      if (!res.ok) throw new Error('AI unavailable')
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply ?? 'Sorry, I had trouble responding.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ AI coach is offline. Make sure your Supabase Edge Function is deployed.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">AI Habit Coach</p>
          <p className="text-[10px] text-slate-500">Powered by GPT-4o mini</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
              }`}
            >
              {msg.role === 'assistant' ? (
                <Bot className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-slate-800 text-slate-200 rounded-tl-sm'
                  : 'bg-emerald-500/20 text-emerald-100 rounded-tr-sm'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="flex-shrink-0 text-[10px] text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full px-2.5 py-1 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask your habit coach..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
