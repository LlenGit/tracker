import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Type definitions ──────────────────────────────────────────────────────

export interface Call {
  id?: string
  client_name: string
  company?: string
  phone?: string
  date: string
  time?: string
  duration_min?: number
  engineer_name?: string
  notes?: string
  recording_url?: string
  tags?: string
  created_at?: string
}

export interface Message {
  id?: string
  type: 'email' | 'message' | 'whatsapp' | 'sms' | 'other'
  direction: 'inbound' | 'outbound'
  sender?: string
  recipient?: string
  company?: string
  subject?: string
  body_summary?: string
  date: string
  engineer_name?: string
  tags?: string
  created_at?: string
}

export interface SiteVisit {
  id?: string
  company: string
  plant_site: string
  location?: string
  visit_date: string
  engineer_name: string
  purpose?: string
  gatepass_docs?: string
  gatepass_validity?: string
  escort_required?: boolean
  ppe_required?: string
  notes?: string
  tags?: string
  created_at?: string
}

export interface Activity {
  id?: string
  title: string
  description?: string
  category?: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  company?: string
  due_date?: string
  completed_date?: string
  notes?: string
  tags?: string
  created_at?: string
}

export type SearchResult = {
  table: 'calls' | 'messages' | 'site_visits' | 'activities'
  record: Call | Message | SiteVisit | Activity
}

// ─── GLEN Types ────────────────────────────────────────────────────────────

export interface GlenPortal {
  id?: string
  company: string
  plant_site?: string
  system_name: string
  login_type?: string
  url?: string
  username?: string
  password?: string
  access_scope?: string
  remark?: string
  tags?: string
  created_at?: string
}

export interface GlenTicket {
  id?: string
  ticket_id?: string
  date_submitted: string
  submitted_by?: string
  company?: string
  plant_site?: string
  category?: 'Hardware' | 'Software' | 'Network' | 'Server Down' | 'Email/Outlook' | 'Other'
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to?: string
  subject: string
  description?: string
  issue_type?: string
  resolution_days?: number
  resolved_date?: string
  notes?: string
  tags?: string
  created_at?: string
}

export interface GlenSite {
  id?: string
  company: string
  plant_site: string
  location_name: string
  station_type?: string
  data_logger_id?: string
  analyzer_type?: string
  parameter?: string
  signal_ip?: string
  make?: string
  model?: string
  serial_number?: string
  status?: 'Active' | 'Offline' | 'Under Maintenance' | 'Decommissioned'
  commissioned_date?: string
  notes?: string
  tags?: string
  created_at?: string
}
