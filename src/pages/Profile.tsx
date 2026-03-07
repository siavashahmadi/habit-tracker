import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Palette, Settings, Info, LogOut, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useStats } from '../hooks/useStats'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface MenuItem {
  icon: typeof User
  label: string
  description: string
  onClick?: () => void
}

export default function Profile() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { stats } = useStats()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleSignOut = async () => {
    if (confirm('Sign out of Habit Tracker?')) {
      await supabase.auth.signOut()
    }
  }

  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const joinedDate = user?.created_at
    ? format(new Date(user.created_at), 'MMMM yyyy')
    : ''

  const menuItems: MenuItem[] = [
    { icon: User, label: 'Edit Profile', description: 'Update your personal information' },
    { icon: Bell, label: 'Notifications', description: 'Manage your reminder settings' },
    { icon: Palette, label: 'Appearance', description: 'Customize your theme' },
    { icon: Settings, label: 'Settings', description: 'App preferences and options' },
    { icon: Info, label: 'About', description: 'Version 1.0.0' },
  ]

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 max-w-2xl mx-auto space-y-6">
      {/* Avatar + Name */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center pt-4"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
        <h2 className="text-lg font-bold text-white">{name}</h2>
        {joinedDate && (
          <p className="text-xs text-slate-400 mt-0.5">Building better habits since {joinedDate}</p>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Quick Stats
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{stats.longestStreak}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total Days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{stats.longestStreak}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Best Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{stats.totalHabits}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Habits</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
        {menuItems.map(({ icon: Icon, label, description, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-rose-400 hover:bg-rose-400/10 hover:border-rose-400/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-rose-400/10 flex items-center justify-center">
          <LogOut className="w-4 h-4 text-rose-400" />
        </div>
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  )
}
