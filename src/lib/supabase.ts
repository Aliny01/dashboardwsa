import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anonKey)

export type FollowerRecord = {
  id?: string
  client_id?: string
  registered_at: string
  total_followers: number
  invested_amount: number
  created_at?: string
}

export type WeeklyReport = {
  id?: string
  client_id?: string
  week_start: string
  week_end: string
  meta_data?: any
  google_data?: any
  ai_analysis?: string
  created_at?: string
}
