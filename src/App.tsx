import { useEffect, useState, Component } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './lib/supabase'

// M8: Error boundary to catch unexpected runtime errors and show a friendly UI
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <p className="text-4xl">💥</p>
            <h2 className="text-white font-semibold">Something went wrong</h2>
            <p className="text-slate-400 text-sm">Please refresh the page to continue.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Pages
import Home from './pages/Home'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import Auth from './pages/Auth'

// Layout
import BottomNav from './components/layout/BottomNav'
import Sidebar from './components/layout/Sidebar'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 lg:pl-60">
      <Sidebar />
      <main className="min-h-screen">{children}</main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}

function AppRouter() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // M3: Targeted invalidation rather than queryClient.clear() to avoid
      // clobbering in-flight queries and causing unnecessary loading states
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['habit_logs'] })
    })

    return () => subscription.unsubscribe()
  }, [])

  // Still loading session
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">⚙️</div>
          <div>
            <h1 className="text-base font-bold text-white">Setup Required</h1>
            <p className="text-xs text-slate-400">Connect your Supabase project to get started</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
          <p className="text-slate-400"># 1. Copy the example env file</p>
          <p className="text-emerald-400">cp .env.example .env</p>
          <p className="text-slate-400 pt-1"># 2. Fill in your values from supabase.com</p>
          <p className="text-amber-300">VITE_SUPABASE_URL=https://your-project.supabase.co</p>
          <p className="text-amber-300">VITE_SUPABASE_ANON_KEY=your-anon-key</p>
          <p className="text-slate-400 pt-1"># 3. Restart the dev server</p>
          <p className="text-emerald-400">npm run dev</p>
        </div>

        <div className="space-y-2 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Quick start:</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Go to <span className="text-emerald-400">supabase.com</span> → New project</li>
            <li>Run <span className="text-slate-200 font-mono">supabase/schema.sql</span> in the SQL editor</li>
            <li>Copy URL + anon key from <span className="text-slate-200">Settings → API</span></li>
            <li>Add them to your <span className="text-slate-200 font-mono">.env</span> file and restart</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupScreen />
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
