'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Phone, Mail, MapPin, CheckSquare, AlertTriangle,
  RefreshCw, TrendingUp, Clock, Building2, Loader2,
  Calendar, ArrowRight, ShieldAlert
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  counts: { calls: number; messages: number; site_visits: number; activities: number }
  activityStatus: Record<string, number>
  activityPriority: Record<string, number>
  topCompanies: { company: string; visits: number }[]
  recentCalls: { id: string; client_name: string; company?: string; date: string; duration_min?: number; engineer_name?: string }[]
  recentVisits: { id: string; company: string; plant_site: string; visit_date: string; engineer_name: string; purpose?: string }[]
  recentMessages: { id: string; type: string; direction: string; sender?: string; company?: string; subject?: string; date: string }[]
  upcomingActivities: { id: string; title: string; due_date: string; priority: string; status: string; assigned_to?: string; company?: string }[]
  overdueActivities: { id: string; title: string; due_date: string; priority: string; assigned_to?: string; company?: string }[]
  generatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-gray-100 text-gray-500',
}
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}
const MSG_TYPE_COLOR: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  message: 'bg-purple-100 text-purple-700',
  sms: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-600',
}

function daysUntil(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 864e5)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  return `in ${diff}d`
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number; icon: React.ElementType; color: string; href: string
}) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
        <span>View all</span><ArrowRight size={12} />
      </div>
    </Link>
  )
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h2>
      {href && (
        <Link href={href} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => load(true), 60_000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm">Loading dashboard…</p>
      </div>
    )
  }

  if (!stats) return <p className="text-center text-gray-500 py-16">Failed to load stats.</p>

  const { counts, activityStatus, activityPriority, topCompanies,
    recentCalls, recentVisits, recentMessages, upcomingActivities, overdueActivities } = stats

  const totalActivities = Object.values(activityStatus).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={24} /> Live Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())} · auto-refreshes every 60s` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overdue alert */}
      {overdueActivities.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">{overdueActivities.length} overdue activit{overdueActivities.length > 1 ? 'ies' : 'y'}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {overdueActivities.map(a => (
                <span key={a.id} className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {a.title} ({daysUntil(a.due_date)})
                </span>
              ))}
            </div>
          </div>
          <Link href="/activities" className="text-xs text-red-600 hover:underline whitespace-nowrap">View all</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Calls"   value={counts.calls}        icon={Phone}       color="bg-blue-100 text-blue-600"   href="/calls" />
        <StatCard label="Messages"      value={counts.messages}     icon={Mail}        color="bg-purple-100 text-purple-600" href="/messages" />
        <StatCard label="Site Visits"   value={counts.site_visits}  icon={MapPin}      color="bg-green-100 text-green-600"  href="/site-visits" />
        <StatCard label="Activities"    value={counts.activities}   icon={CheckSquare} color="bg-orange-100 text-orange-600" href="/activities" />
      </div>

      {/* Middle row: Activity status + Priority + Companies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Activity status breakdown */}
        <div className="card">
          <SectionHeader title="Activity Status" href="/activities" />
          <div className="space-y-2">
            {[
              { key: 'open',        label: 'Open',        bar: 'bg-blue-400' },
              { key: 'in_progress', label: 'In Progress', bar: 'bg-yellow-400' },
              { key: 'completed',   label: 'Completed',   bar: 'bg-green-400' },
              { key: 'cancelled',   label: 'Cancelled',   bar: 'bg-gray-300' },
            ].map(({ key, label, bar }) => {
              const count = activityStatus[key] ?? 0
              const pct = totalActivities ? Math.round((count / totalActivities) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{count} <span className="text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity priority */}
        <div className="card">
          <SectionHeader title="Open Priorities" />
          <div className="flex flex-col gap-3 mt-1">
            {[
              { key: 'high',   label: 'High',   icon: '🔴', bg: 'bg-red-50 border-red-100' },
              { key: 'medium', label: 'Medium', icon: '🟠', bg: 'bg-orange-50 border-orange-100' },
              { key: 'low',    label: 'Low',    icon: '⚪', bg: 'bg-gray-50 border-gray-100' },
            ].map(({ key, label, icon, bg }) => (
              <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${bg}`}>
                <span className="text-sm text-gray-700">{icon} {label}</span>
                <span className="font-bold text-gray-900 text-lg">{activityPriority[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top companies by visits */}
        <div className="card">
          <SectionHeader title="Visits by Company" href="/site-visits" />
          {topCompanies.length === 0
            ? <p className="text-xs text-gray-400 text-center py-4">No visits yet</p>
            : (
              <div className="space-y-2">
                {topCompanies.map(({ company, visits }) => {
                  const max = topCompanies[0].visits
                  const pct = Math.round((visits / max) * 100)
                  return (
                    <div key={company}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium flex items-center gap-1">
                          <Building2 size={11} className="text-green-600" /> {company}
                        </span>
                        <span className="text-gray-500">{visits} visit{visits > 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      </div>

      {/* Bottom row: Upcoming + Recent feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Upcoming activities */}
        <div className="card">
          <SectionHeader title="Due in Next 14 Days" href="/activities" />
          {upcomingActivities.length === 0
            ? <p className="text-xs text-gray-400 text-center py-6">No upcoming due dates</p>
            : (
              <div className="space-y-2">
                {upcomingActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-t border-gray-50 first:border-0">
                    <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.assigned_to ?? '—'} {a.company ? `· ${a.company}` : ''}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`badge ${PRIORITY_COLOR[a.priority] ?? ''}`}>{a.priority}</span>
                      <p className={`text-xs mt-1 ${daysUntil(a.due_date).includes('overdue') ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {daysUntil(a.due_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Recent activity feed */}
        <div className="card">
          <SectionHeader title="Recent Activity" />
          <div className="space-y-1">

            {recentCalls.slice(0, 2).map(c => (
              <div key={c.id} className="flex items-start gap-3 py-2 border-t border-gray-50 first:border-0">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone size={11} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.client_name} {c.company ? `— ${c.company}` : ''}</p>
                  <p className="text-xs text-gray-400">{c.engineer_name ?? '—'} · {c.duration_min ? `${c.duration_min}min` : 'call'}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{c.date}</span>
              </div>
            ))}

            {recentMessages.slice(0, 2).map(m => (
              <div key={m.id} className="flex items-start gap-3 py-2 border-t border-gray-50">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail size={11} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.subject ?? m.sender ?? 'Message'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span className={`badge ${MSG_TYPE_COLOR[m.type] ?? ''} py-0`}>{m.type}</span>
                    {m.direction} {m.company ? `· ${m.company}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{m.date}</span>
              </div>
            ))}

            {recentVisits.slice(0, 2).map(v => (
              <div key={v.id} className="flex items-start gap-3 py-2 border-t border-gray-50">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={11} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{v.company} / {v.plant_site}</p>
                  <p className="text-xs text-gray-400">{v.engineer_name} {v.purpose ? `· ${v.purpose}` : ''}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{v.visit_date}</span>
              </div>
            ))}

            {(recentCalls.length + recentMessages.length + recentVisits.length) === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No recent activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent site visits table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <SectionHeader title="Recent Site Visits" href="/site-visits" />
        </div>
        {recentVisits.length === 0
          ? <p className="text-xs text-gray-400 text-center pb-8">No site visits logged yet</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Company', 'Plant / Site', 'Engineer', 'Purpose'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentVisits.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="table-td whitespace-nowrap">{v.visit_date}</td>
                    <td className="table-td font-semibold text-green-800">{v.company}</td>
                    <td className="table-td">{v.plant_site}</td>
                    <td className="table-td">{v.engineer_name}</td>
                    <td className="table-td text-gray-500">{v.purpose ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-300 pb-2">
        FieldTracker · Data from Supabase · Auto-refreshes every 60s
      </p>
    </div>
  )
}
