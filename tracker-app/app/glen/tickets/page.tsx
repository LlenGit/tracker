'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, TicketCheck, Loader2, AlertTriangle } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { GlenTicket } from '@/lib/supabase'

const EMPTY: Omit<GlenTicket, 'id' | 'created_at'> = {
  ticket_id: '', date_submitted: new Date().toISOString().slice(0,10),
  submitted_by: '', company: '', plant_site: '', category: undefined,
  priority: 'High', status: 'Open', assigned_to: '', subject: '',
  description: '', issue_type: '', resolution_days: undefined, resolved_date: '', notes: '', tags: '',
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

const ISSUE_TYPES = [
  'Data Not Upload','Value Mismatch','Device Offline','Data Showing NA',
  'Power Shutdown','New Site Config','Analyzer Issue','IP Change',
  'Mobile App Not Work','Server Issue','Data Pushed','Other'
]

export default function GlenTicketsPage() {
  const [rows, setRows] = useState<GlenTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [filterStatus, setFilterStatus] = useState('all')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/glen/tickets')
    setRows(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, resolution_days: form.resolution_days ?? null, resolved_date: form.resolved_date || null }
    await fetch('/api/glen/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/glen/tickets', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolved_date: status === 'Resolved' ? new Date().toISOString().slice(0,10) : null })
    })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this ticket?')) return
    await fetch('/api/glen/tickets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const counts = { all: rows.length, Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 }
  rows.forEach(r => { if (counts[r.status as keyof typeof counts] !== undefined) (counts as Record<string, number>)[r.status]++ })
  const filtered = filterStatus === 'all' ? rows : rows.filter(r => r.status === filterStatus)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TicketCheck className="text-orange-600" size={22} /> Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">GLEN system issue tracking — hardware, software, network, server</p>
        </div>
        <div className="flex gap-2">
          <ExportButton table="glen_tickets" label="Export CSV" />
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all','Open','In Progress','Resolved','Closed'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filterStatus === s ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? `All (${counts.all})` : `${s} (${counts[s as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Log Support Ticket</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Ticket ID (SL#)</label><input className="input" placeholder="e.g. SL111538" value={form.ticket_id} onChange={e => set('ticket_id', e.target.value)} /></div>
            <div><label className="label">Date Submitted *</label><input required type="date" className="input" value={form.date_submitted} onChange={e => set('date_submitted', e.target.value)} /></div>
            <div><label className="label">Submitted By</label><input className="input" value={form.submitted_by} onChange={e => set('submitted_by', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Plant / Site</label><input className="input" placeholder="e.g. TSM Meramandali" value={form.plant_site} onChange={e => set('plant_site', e.target.value)} /></div>
            <div>
              <label className="label">Issue Type</label>
              <select className="input" value={form.issue_type} onChange={e => set('issue_type', e.target.value)}>
                <option value="">Select…</option>
                {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category ?? ''} onChange={e => set('category', e.target.value || undefined)}>
                <option value="">Select…</option>
                {['Hardware','Software','Network','Server Down','Email/Outlook','Other'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority ?? 'High'} onChange={e => set('priority', e.target.value)}>
                {['Critical','High','Medium','Low'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['Open','In Progress','Resolved','Closed'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><label className="label">Subject / Issue *</label><input required className="input" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
            <div><label className="label">Assigned To</label><input className="input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} /></div>
            <div className="md:col-span-2"><label className="label">Description (Location / Equipment / Stack)</label><input className="input" placeholder="e.g. Stack15_Coke_oven1_Battery1" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><label className="label">Resolution Days</label><input type="number" min={0} className="input" value={form.resolution_days ?? ''} onChange={e => set('resolution_days', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
            <div><label className="label">Resolved Date</label><input type="date" className="input" value={form.resolved_date ?? ''} onChange={e => set('resolved_date', e.target.value)} /></div>
            <div><label className="label">Notes / Resolution</label><input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save Ticket
            </button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No tickets found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>{['Ticket ID','Date','Subject','Issue Type','Category','Priority','Status','Assigned','Description / Notes',''].map(h=>(
                <th key={h} className="table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.status === 'Resolved' || r.status === 'Closed' ? 'opacity-70' : ''}`}>
                  <td className="table-td font-mono text-xs">
                    {r.status === 'Open' && <AlertTriangle size={12} className="text-red-400 inline mr-1" />}
                    {r.ticket_id || '—'}
                  </td>
                  <td className="table-td whitespace-nowrap">{r.date_submitted}</td>
                  <td className="table-td font-medium max-w-xs truncate">{r.subject}</td>
                  <td className="table-td text-xs">{r.issue_type ?? '—'}</td>
                  <td className="table-td">{r.category ?? '—'}</td>
                  <td className="table-td"><span className={`badge ${PRIORITY_BADGE[r.priority ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>{r.priority ?? '—'}</span></td>
                  <td className="table-td">
                    <select value={r.status} onChange={e => updateStatus(r.id!, e.target.value)}
                      className={`badge cursor-pointer border-0 ${STATUS_BADGE[r.status]} text-xs font-medium rounded px-2 py-0.5`}>
                      {['Open','In Progress','Resolved','Closed'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="table-td">{r.assigned_to ?? '—'}</td>
                  <td className="table-td max-w-xs text-gray-500 truncate text-xs">{r.description ?? r.notes ?? '—'}</td>
                  <td className="table-td">
                    <button onClick={() => del(r.id!)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
