import { NavLink } from 'react-router-dom'
import { Home, BarChart2, User, Flame, Plus } from 'lucide-react'
import { useHabitStore } from '../../store/habitStore'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/stats', icon: BarChart2, label: 'Stats', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
]

export default function Sidebar() {
  const { setAddModalOpen } = useHabitStore()

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-slate-900 border-r border-slate-800 px-4 py-6 fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Flame className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Habit Tracker</p>
          <p className="text-[10px] text-slate-500 leading-tight">Build better habits</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4.5 h-4.5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Add Habit Button */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors mt-4"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add Habit
      </button>
    </aside>
  )
}
