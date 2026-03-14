import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { Milestone } from '../../lib/milestones'

interface MilestoneCelebrationProps {
  milestone: Milestone | null
  habitName: string
  onDismiss: () => void
}

/**
 * Fires confetti and shows an animated toast when a streak milestone is crossed.
 * Confetti intensity scales with the milestone level.
 * Auto-dismisses after 3.5s.
 */
export default function MilestoneCelebration({
  milestone,
  habitName,
  onDismiss,
}: MilestoneCelebrationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!milestone) return

    // Fire confetti based on intensity
    const fire = (opts: confetti.Options) =>
      confetti({ zIndex: 9999, disableForReducedMotion: true, ...opts })

    if (milestone.intensity === 1) {
      fire({ particleCount: 60, spread: 55, origin: { y: 0.7 } })
    } else if (milestone.intensity === 2) {
      fire({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setTimeout(() => fire({ particleCount: 50, spread: 50, origin: { y: 0.65 } }), 200)
    } else {
      // Full send — two-cannon burst
      fire({ particleCount: 120, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 } })
      fire({ particleCount: 120, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } })
      setTimeout(() => {
        fire({ particleCount: 80, spread: 100, origin: { y: 0.5 }, gravity: 0.7 })
      }, 300)
    }

    // Auto-dismiss
    timerRef.current = setTimeout(onDismiss, 3500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [milestone, onDismiss])

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          key={milestone.days}
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 340 }}
          onClick={onDismiss}
          className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
        >
          <div className="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/40 backdrop-blur-sm min-w-[280px] max-w-sm">
            <span className="text-3xl flex-shrink-0">{milestone.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">{milestone.label}!</p>
              <p className="text-xs text-slate-400 truncate">{habitName}</p>
            </div>
            {/* Animated progress bar showing auto-dismiss timing */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3.5, ease: 'linear' }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
