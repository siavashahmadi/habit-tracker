import { memo } from 'react'
import { motion } from 'framer-motion'
import { getStreakLevelNumber, getGlowColor } from '../../lib/streakLevel'
import type { HabitType } from '../../types'

interface HabitIconProps {
  icon: string
  color: string
  type: HabitType
  streak: number
}

function HabitIconInner({ icon, color, type, streak }: HabitIconProps) {
  const level = getStreakLevelNumber(streak)

  if (level === 0) {
    return <span className="text-2xl flex-shrink-0">{icon}</span>
  }

  const glowColor = getGlowColor(color, type, 1)
  const ringOpacity = level === 1 ? 0.3 : level === 2 ? 0.5 : 0.7

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 40, height: 40 }}>
      {/* Ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${getGlowColor(color, type, ringOpacity)}`,
          ...(level >= 2 && {
            boxShadow: `inset 0 0 6px ${getGlowColor(color, type, 0.15)}`,
          }),
          ...(level >= 5 && {
            background: `linear-gradient(135deg, ${getGlowColor(color, type, 0.2)}, transparent, ${getGlowColor(color, type, 0.2)})`,
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s linear infinite',
          }),
        }}
        animate={
          level >= 2 && level < 5
            ? { scale: [1, 1.04, 1], opacity: [1, 0.85, 1] }
            : undefined
        }
        transition={
          level >= 2 && level < 5
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Sparkle dots for level 3+ */}
      {level >= 3 && level < 5 && (
        <>
          {[0, 1, 2].slice(0, level === 3 ? 2 : 3).map((i) => {
            const angle = (i * 120 + 30) * (Math.PI / 180)
            const radius = 22
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  backgroundColor: glowColor,
                  top: 20 + Math.sin(angle) * radius - 1.5,
                  left: 20 + Math.cos(angle) * radius - 1.5,
                }}
                animate={{
                  opacity: [0.3, 0.9, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeInOut',
                }}
              />
            )
          })}
        </>
      )}

      {/* Crown for level 4+ */}
      {level >= 4 && (
        <span className="absolute -top-1 -right-1 text-xs">👑</span>
      )}

      {/* Gold sparkles for level 5 */}
      {level >= 5 && (
        <>
          {[0, 1, 2].map((i) => {
            const angle = (i * 120 + 60) * (Math.PI / 180)
            const radius = 24
            return (
              <motion.div
                key={`gold-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  backgroundColor: '#fbbf24',
                  top: 20 + Math.sin(angle) * radius - 1.5,
                  left: 20 + Math.cos(angle) * radius - 1.5,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.6, 1.3, 0.6],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeInOut',
                }}
              />
            )
          })}
        </>
      )}

      {/* The emoji */}
      <span className="text-2xl relative z-10">{icon}</span>
    </div>
  )
}

const HabitIcon = memo(HabitIconInner)
export default HabitIcon
