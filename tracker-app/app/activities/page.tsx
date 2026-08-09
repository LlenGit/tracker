'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckSquare, Loader2, Circle, CheckCircle2 } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { Activity } from '@/lib/supabase'

const EMPTY: Omit<Activity, 'id' | 'created_at'> = {
  title: '', description: '', category: '', status: 'open', priority: 'medium',
  assigned_to: '', company: '', due_date: '', completed_date: '', notes: '', tags: '',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}

export default function ActivitiesPage() {
  const [rows, setRows] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/activities')
    setRows(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, due_date: form.due_date || null, completed_date: form.completed_date || null }
    await fetch('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY })
    load()
  }

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'open' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'open'
    await fetch('/api/activities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next, completed_date: next === 'completed' ? new Date().toISOString().slice(0,10) : null })
    })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this activity?')) return
    await fetch('/api/activities', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const filtered = filterStatus === 'all' ? rows : rows.filter(r => r.status === filterStatus)
  const counts = { open: rows.filter(r=>r.status==='open').length, in_progress: rows.filter(r=>r.status==='in_progress').length, completed: rows.filter(r=>r.status==='completed').length }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="text-orange-600" size={22} /> Activities</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track tasks, meetings, field work, and follow-ups</p>
        </div>
        <div className="flex gap-2">
          <ExportButton table="activities" />
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Activity
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'open', label: 'Open', color: 'border-blue-200 bg-blue-50 text-blue-800' },
          { key: 'in_progress', label: 'In Progress', color: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
          { key: 'completed', label: 'Completed', color: 'border-green-200 bg-green-50 text-green-800' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)}
            className={`rounded-lg border p-3 text-center transition-all ${s.color} ${filterStatus === s.key ? 'ring-2 ring-offset-1 ring-blue-400' : 'hover:opacity-80'}`}>
            <div className="text-2xl font-bold">{counts[s.key as keyof typeof counts]}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">New Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="label">Title *</label><input required className="input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select...</option>
                <option>Meeting</option>
                <option>Site Work</option>
                <option>Admin</option>
                <option>Follow-up</option>
                <option>Report</option>
                <option>Training</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div><label className="label">Assigned To</label><input className="input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
            <div><label className="label">Tags</label><input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
            <div className="md:col-span-3"><label className="label">Description / Notes</label><textarea rows={3} className="input" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No activities found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['','Title','Category','Company','Assigned','Priority','Status','Due Date',''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.status === 'completed' ? 'opacity-60' : ''}`}>
                  <td className="table-td">
                    <button onClick={() => toggleStatus(r.id!, r.status)} title="Click to advance status">
                      {r.status === 'completed'
                        ? <CheckCircle2 size={18} className="text-green-500" />
                        : <Circle size={18} className="text-gray-300 hover:text-blue-400" />}
                    </button>
                  </td>
                  <td className="table-td font-medium max-w-xs">
                    <span className={r.status === 'completed' ? 'line-through text-gray-400' : ''}>{r.title}</span>
                    {r.description && <p className="text-xs text-gray-400 truncate">{r.description}</p>}
                  </td>
                  <td className="table-td">{r.category ?? '—'}</td>
                  <td className="table-td">{r.company ?? '—'}</td>
                  <td className="table-td">{r.assigned_to ?? '—'}</td>
                  <td className="table-td">
                    <span className={`badge ${PRIORITY_COLORS[r.priority] ?? ''}`}>{r.priority}</span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${STATUS_COLORS[r.status] ?? ''}`}>{r.status.replace('_',' ')}</span>
                  </td>
                  <td className="table-td whitespace-nowrap">{r.due_date ?? '—'}</td>
                  <td className="table-td">
                    <button onClick={() => del(r.id!)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
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
