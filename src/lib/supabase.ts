import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Flag consumed by App.tsx to show a setup screen instead of crashing
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Use placeholder values so createClient doesn't throw — real calls will
// fail gracefully when isSupabaseConfigured is false (app shows setup screen first)
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'good' | 'bad'
          icon: string
          color: string
          created_at: string
          archived_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['habits']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['habits']['Insert']>
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          logged_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['habit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['habit_logs']['Insert']>
      }
    }
  }
}
