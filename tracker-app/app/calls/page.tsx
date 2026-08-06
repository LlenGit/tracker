'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Phone, Loader2, Link as LinkIcon } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { Call } from '@/lib/supabase'

const EMPTY: Omit<Call, 'id' | 'created_at'> = {
  client_name: '', company: '', phone: '', date: new Date().toISOString().slice(0,10),
  time: '', duration_min: undefined, engineer_name: '', notes: '', recording_url: '', tags: '',
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/calls')
    setCalls(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this call log?')) return
    await fetch('/api/calls', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="text-blue-600" size={22} /> Calls</h1>
          <p className="text-sm text-gray-500 mt-0.5">Log client calls, recordings, and notes</p>
        </div>
        <div className="flex gap-2">
          <ExportButton table="calls" />
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Call
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Log a Call</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Client Name *</label><input required className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Date *</label><input required type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className="label">Time</label><input type="time" className="input" value={form.time} onChange={e => set('time', e.target.value)} /></div>
            <div><label className="label">Duration (min)</label><input type="number" min={0} className="input" value={form.duration_min ?? ''} onChange={e => set('duration_min', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
            <div><label className="label">Engineer Name</label><input className="input" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} /></div>
            <div><label className="label">Recording URL</label><input type="url" className="input" placeholder="https://..." value={form.recording_url} onChange={e => set('recording_url', e.target.value)} /></div>
            <div><label className="label">Tags (comma-separated)</label><input className="input" placeholder="important, follow-up" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
            <div className="md:col-span-3"><label className="label">Notes</label><textarea rows={3} className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save Call
            </button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={24} /></div>
        ) : calls.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No calls logged yet. Add one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Date','Client','Company','Engineer','Duration','Notes','Recording',''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calls.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-td whitespace-nowrap">{c.date}</td>
                  <td className="table-td font-medium">{c.client_name}</td>
                  <td className="table-td">{c.company ?? '—'}</td>
                  <td className="table-td">{c.engineer_name ?? '—'}</td>
                  <td className="table-td">{c.duration_min != null ? `${c.duration_min} min` : '—'}</td>
                  <td className="table-td max-w-xs truncate">{c.notes ?? '—'}</td>
                  <td className="table-td">
                    {c.recording_url
                      ? <a href={c.recording_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><LinkIcon size={12} />Link</a>
                      : '—'}
                  </td>
                  <td className="table-td">
                    <button onClick={() => del(c.id!)} className="text-red-400 hover:text-red-600 transition-colors">
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
