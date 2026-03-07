import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  icon: ReactNode
  value: string | number
  label: string
  accent?: string // tailwind color class e.g. 'text-emerald-400'
  iconBg?: string // e.g. 'bg-emerald-500/20'
}

export default function StatCard({ icon, value, label, accent = 'text-white', iconBg = 'bg-slate-800' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
    >
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${accent} leading-none mb-1`}>{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </motion.div>
  )
}
