'use client'
import { useEffect, useState, useCallback } from 'react'
import { Wifi, Key, MapPin, TicketCheck, RefreshCw, Loader2, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

interface GlenStats {
  totals: { tickets: number; portals: number; sites: number }
  ticketStatus: Record<string, number>
  ticketCategory: Record<string, number>
  ticketPriority: Record<string, number>
  topIssueTypes: { type: string; count: number }[]
  avgResolutionDays: number
  siteStatus: Record<string, number>
  recentTickets: {
    id: string; ticket_id?: string; date_submitted: string; subject: string
    category?: string; priority?: string; status: string; assigned_to?: string
    company?: string; plant_site?: string; issue_type?: string
  }[]
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  'Open':        <AlertTriangle size={14} className="text-red-500" />,
  'In Progress': <Clock size={14} className="text-yellow-500" />,
  'Resolved':    <CheckCircle2 size={14} className="text-green-500" />,
  'Closed':      <XCircle size={14} className="text-gray-400" />,
}
const STATUS_BADGE: Record<string, string> = {
  'Open':        'bg-red-100 text-red-700',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Resolved':    'bg-green-100 text-green-700',
  'Closed':      'bg-gray-100 text-gray-500',
}
const PRIORITY_BADGE: Record<string, string> = {
  'Critical': 'bg-red-200 text-red-800',
  'High':     'bg-red-100 text-red-700',
  'Medium':   'bg-orange-100 text-orange-700',
  'Low':      'bg-gray-100 text-gray-600',
}
const ISSUE_SEVERITY: Record<string, string> = {
  'Data Not Upload': 'bg-red-400',
  'Device Offline':  'bg-red-400',
  'Power Shutdown':  'bg-red-400',
  'Value Mismatch':  'bg-orange-400',
  'Analyzer Issue':  'bg-orange-400',
  'Data Showing NA': 'bg-yellow-400',
  'IP Change':       'bg-yellow-400',
  'New Site Config': 'bg-green-400',
  'Other':           'bg-green-400',
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function GlenHubPage() {
  const [stats, setStats] = useState<GlenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/glen/stats')
      setStats(await res.json())
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(() => load(true), 60_000)
    return () => clearInterval(iv)
  }, [load])

  if (loading) return (
    <div className="flex justify-center items-center py-32 gap-3">
      <Loader2 size={28} className="animate-spin text-cyan-600" /><p className="text-gray-500">Loading GLEN data…</p>
    </div>
  )

  const s = stats!
  const openCount = s.ticketStatus['Open'] ?? 0
  const inProgressCount = s.ticketStatus['In Progress'] ?? 0
  const totalTickets = Object.values(s.ticketStatus).reduce((a,b) => a+b, 0)
  const offlineSites = s.siteStatus['Offline'] ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wifi className="text-cyan-600" size={24} /> GLEN Portal
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            G-Lens · iLens · OSPCB RTDAS · IoT Manager
            {lastUpdated && ` · Updated ${timeAgo(lastUpdated.toISOString())}`}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Alert: open/offline */}
      {(openCount > 0 || offlineSites > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            {openCount > 0 && <><strong>{openCount} open ticket{openCount > 1 ? 's' : ''}</strong> need attention. </>}
            {offlineSites > 0 && <><strong>{offlineSites} monitoring station{offlineSites > 1 ? 's' : ''}</strong> offline.</>}
          </p>
        </div>
      )}

      {/* Quick nav cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/glen/portals', icon: Key,        label: 'Portal Logins', count: s.totals.portals, color: 'bg-cyan-50 text-cyan-700', iconBg: 'bg-cyan-100' },
          { href: '/glen/tickets', icon: TicketCheck, label: 'Support Tickets', count: s.totals.tickets, color: 'bg-orange-50 text-orange-700', iconBg: 'bg-orange-100' },
          { href: '/glen/sites',   icon: MapPin,      label: 'CAAQMS Sites', count: s.totals.sites, color: 'bg-green-50 text-green-700', iconBg: 'bg-green-100' },
        ].map(({ href, icon: Icon, label, count, color, iconBg }) => (
          <Link key={href} href={href} className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon size={22} className={color.split(' ')[1]} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold text-gray-900">{count}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Ticket stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'Open',        label: 'Open',         color: 'border-red-200 bg-red-50 text-red-800' },
          { key: 'In Progress', label: 'In Progress',  color: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
          { key: 'Resolved',    label: 'Resolved',     color: 'border-green-200 bg-green-50 text-green-800' },
          { key: 'Closed',      label: 'Closed',       color: 'border-gray-200 bg-gray-50 text-gray-600' },
        ].map(({ key, label, color }) => (
          <div key={key} className={`rounded-xl border p-4 text-center ${color}`}>
            <div className="flex justify-center mb-1">{STATUS_ICON[key]}</div>
            <p className="text-2xl font-bold">{s.ticketStatus[key] ?? 0}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Middle row: Issue types + Category + Avg resolution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Top issue types */}
        <div className="card md:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Issue Type Breakdown</p>
          {s.topIssueTypes.length === 0
            ? <p className="text-gray-400 text-sm text-center py-4">No tickets yet</p>
            : (
              <div className="space-y-2">
                {s.topIssueTypes.map(({ type, count }) => {
                  const pct = totalTickets ? Math.round((count / totalTickets) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 flex items-center gap-1.5"><span className={`inline-block w-2 h-2 rounded-full ${ISSUE_SEVERITY[type] ?? 'bg-gray-300'}`} />{type}</span>
                        <span className="text-gray-500 font-medium">{count} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

        {/* Category + Avg resolution */}
        <div className="space-y-4">
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Category</p>
            <div className="space-y-1.5">
              {Object.entries(s.ticketCategory).sort(([,a],[,b])=>b-a).map(([cat, cnt]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-semibold text-gray-900">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card text-center bg-cyan-50 border-cyan-200">
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">Avg Resolution</p>
            <p className="text-4xl font-bold text-cyan-800">{s.avgResolutionDays}</p>
            <p className="text-xs text-cyan-600 mt-1">days (resolved tickets)</p>
          </div>
        </div>
      </div>

      {/* Recent tickets table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 pb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Tickets</p>
          <Link href="/glen/tickets" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        {s.recentTickets.length === 0
          ? <p className="text-center text-gray-400 py-8 text-sm">No tickets logged yet</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr>{['Ticket ID','Date','Subject','Category','Priority','Status','Assigned'].map(h=>(
                  <th key={h} className="table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {s.recentTickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs">{t.ticket_id ?? '—'}</td>
                    <td className="table-td whitespace-nowrap">{t.date_submitted}</td>
                    <td className="table-td max-w-xs truncate font-medium">{t.subject}</td>
                    <td className="table-td">{t.category ?? '—'}</td>
                    <td className="table-td"><span className={`badge ${PRIORITY_BADGE[t.priority ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>{t.priority ?? '—'}</span></td>
                    <td className="table-td"><span className={`badge ${STATUS_BADGE[t.status] ?? ''}`}>{t.status}</span></td>
                    <td className="table-td">{t.assigned_to ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
