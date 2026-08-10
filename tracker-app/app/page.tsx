'use client'
import { useState, useCallback } from 'react'
import { Search, Phone, Mail, MapPin, CheckSquare, Loader2, ExternalLink, Wifi, Key, TicketCheck, Wind } from 'lucide-react'
import Link from 'next/link'

type TableName = 'calls' | 'messages' | 'site_visits' | 'activities' | 'glen_portals' | 'glen_tickets' | 'glen_sites'

const TABLE_META: Record<TableName, { label: string; icon: React.ElementType; color: string; href: string }> = {
  calls: { label: 'Call', icon: Phone, color: 'bg-blue-100 text-blue-700', href: '/calls' },
  messages: { label: 'Message', icon: Mail, color: 'bg-purple-100 text-purple-700', href: '/messages' },
  site_visits: { label: 'Site Visit', icon: MapPin, color: 'bg-green-100 text-green-700', href: '/site-visits' },
  activities: { label: 'Activity', icon: CheckSquare, color: 'bg-orange-100 text-orange-700', href: '/activities' },
  glen_portals: { label: 'GLENS Portal', icon: Key, color: 'bg-cyan-100 text-cyan-700', href: '/glen/portals' },
  glen_tickets: { label: 'GLENS Ticket', icon: TicketCheck, color: 'bg-orange-100 text-orange-700', href: '/glen/tickets' },
  glen_sites: { label: 'GLENS Site', icon: Wind, color: 'bg-teal-100 text-teal-700', href: '/glen/sites' },
}

function getTitle(table: TableName, record: Record<string, unknown>): string {
  switch (table) {
    case 'calls':       return `${record.client_name} — ${record.company ?? ''}`
    case 'messages':    return String(record.subject ?? `${record.type} from ${record.sender ?? 'unknown'}`)
    case 'site_visits': return `${record.company} / ${record.plant_site}`
    case 'activities':  return String(record.title)
    case 'glen_portals': return `${record.system_name} — ${record.company}`
    case 'glen_tickets': return String(record.subject)
    case 'glen_sites':  return `${record.location_name} (${record.plant_site})`
    default:            return ''
  }
}

function getSubtitle(table: TableName, record: Record<string, unknown>): string {
  switch (table) {
    case 'calls':       return `Engineer: ${record.engineer_name ?? '—'} | Date: ${record.date} | Duration: ${record.duration_min ?? '?'} min`
    case 'messages':    return `${record.direction} | ${record.sender ?? ''} → ${record.recipient ?? ''} | ${record.date}`
    case 'site_visits': return `Engineer: ${record.engineer_name} | Date: ${record.visit_date} | Docs: ${record.gatepass_docs ?? '—'}`
    case 'activities':  return `Status: ${record.status} | Priority: ${record.priority} | Assigned: ${record.assigned_to ?? '—'}`
    case 'glen_portals': return `${record.login_type ?? ''} | User: ${record.username ?? '—'} | Access: ${record.access_scope ?? '—'}`
    case 'glen_tickets': return `${record.category ?? ''} · ${record.priority ?? ''} · ${record.status} | ${record.date_submitted}`
    case 'glen_sites':  return `${record.station_type ?? ''} | Parameter: ${record.parameter ?? '—'} | Status: ${record.status ?? '—'}`
    default:            return ''
  }
}

const STAT_CARDS = [
  { label: 'Calls', href: '/calls', icon: Phone, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { label: 'Messages', href: '/messages', icon: Mail, bg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { label: 'Site Visits', href: '/site-visits', icon: MapPin, bg: 'bg-green-50', iconColor: 'text-green-600' },
  { label: 'Activities', href: '/activities', icon: CheckSquare, bg: 'bg-orange-50', iconColor: 'text-orange-600' },
  { label: 'GLENS', href: '/glen', icon: Wifi, bg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
]

export default function DashboardPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ table: TableName; record: Record<string, unknown> }[]>([])
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [searched, setSearched] = useState(false)
  const [activeFilter, setActiveFilter] = useState<TableName | 'all'>('all')

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.results ?? [])
      setCounts(json.counts ?? null)
      setActiveFilter('all')
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = activeFilter === 'all' ? results : results.filter(r => r.table === activeFilter)

  return (
    <div className="space-y-8">
      {/* Hero search */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-6 sm:p-8 text-white text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">FieldTracker</h1>
        <p className="text-blue-200 mb-6 text-sm">Search across calls, messages, site visits & activities</p>
        <form
          onSubmit={e => { e.preventDefault(); search(query) }}
          className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search anything — e.g. "Hindalco"'
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-blue-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </form>
      </div>

      {/* Quick-nav cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, href, icon: Icon, bg, iconColor }) => (
          <Link
            key={href}
            href={href}
            className={`card flex flex-col items-center gap-3 py-6 hover:shadow-md transition-shadow cursor-pointer ${bg}`}
          >
            <Icon size={28} className={iconColor} />
            <span className="font-semibold text-gray-800">{label}</span>
          </Link>
        ))}
      </div>

      {/* Search results */}
      {searched && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-gray-800 mr-2">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </h2>
            {/* Filter chips */}
            {(['all', 'calls', 'messages', 'site_visits', 'activities'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${activeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {t === 'all' ? `All (${results.length})` : `${TABLE_META[t].label}s (${counts?.[t] ?? 0})`}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8">No results found.</p>
          )}

          <div className="space-y-2">
            {filtered.map((item, i) => {
              const meta = TABLE_META[item.table]
              const Icon = meta.icon
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <span className={`badge mt-0.5 ${meta.color} flex-shrink-0`}>
                    <Icon size={11} className="mr-1" />{meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {getTitle(item.table, item.record)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getSubtitle(item.table, item.record)}
                    </p>
                    {!!item.record.notes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{String(item.record.notes)}</p>
                    )}
                  </div>
                  <Link href={meta.href} className="text-gray-400 hover:text-blue-600 flex-shrink-0 mt-0.5">
                    <ExternalLink size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
