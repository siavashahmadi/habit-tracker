import { NavLink } from 'react-router-dom'
import { Home, Plus, BarChart2, User } from 'lucide-react'
import { useHabitStore } from '../../store/habitStore'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { setAddModalOpen } = useHabitStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.slice(0, 1).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center Add Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setAddModalOpen(true)}
          className="flex flex-col items-center gap-0.5 -mt-4"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-colors">
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-medium text-slate-500">Add</span>
        </motion.button>

        {NAV_ITEMS.slice(1).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
