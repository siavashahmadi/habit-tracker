import { useMemo } from 'react'
import { format, startOfWeek, addDays, isToday, isFuture, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { useToggleLog } from '../../hooks/useHabitLogs'
import { useHabitStore } from '../../store/habitStore'
import type { HabitType, HabitLog } from '../../types'

interface WeekStripProps {
  habitId: string
  habitType: HabitType
  habitColor: string
  logs: HabitLog[]
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function WeekStrip({ habitId, habitType, habitColor, logs }: WeekStripProps) {
  const toggleLog = useToggleLog()
  const { isOptimisticallyLogged } = useHabitStore()

  const weekDays = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        date: dateStr,
        dayIndex: i,
        isToday: isToday(date),
        isFuture: isFuture(date) && !isToday(date),
      }
    })
  }, [])

  const handleCellClick = (dateStr: string, isFutureDay: boolean) => {
    if (isFutureDay) return
    const currentlyLogged = isOptimisticallyLogged(habitId, dateStr, logs)
    toggleLog.mutate({ habitId, date: dateStr, currentlyLogged })
  }

  return (
    <div className="flex gap-2">
      {weekDays.map((day) => {
        const filled = isOptimisticallyLogged(habitId, day.date, logs)

        let bgClass: string
        if (day.isFuture) {
          bgClass = 'bg-slate-800/40'
        } else if (!filled) {
          bgClass = 'bg-slate-800 hover:bg-slate-700'
        } else if (habitType === 'good') {
          bgClass = ''
        } else {
          bgClass = 'bg-rose-500'
        }

        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
            <span className={`text-[10px] font-medium ${day.isToday ? 'text-white' : 'text-slate-500'}`}>
              {DAY_LABELS[day.dayIndex]}
            </span>
            <motion.button
              whileTap={!day.isFuture ? { scale: 0.85 } : undefined}
              onClick={() => handleCellClick(day.date, day.isFuture)}
              disabled={day.isFuture}
              title={`${format(parseISO(day.date), 'MMM d, yyyy')}${filled ? ' ✓' : ''}`}
              className={`w-full aspect-square rounded-xl transition-all duration-150 ${bgClass} ${
                day.isToday ? 'ring-2 ring-white/30' : ''
              } ${!day.isFuture ? 'cursor-pointer' : 'cursor-default'}`}
              style={filled && habitType === 'good' ? { backgroundColor: habitColor } : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
