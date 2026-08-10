'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Mail, Loader2 } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { Message } from '@/lib/supabase'

const EMPTY: Omit<Message, 'id' | 'created_at'> = {
  type: 'email', direction: 'inbound', sender: '', recipient: '', company: '',
  subject: '', body_summary: '', date: new Date().toISOString().slice(0,10),
  engineer_name: '', tags: '',
}

const TYPE_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700',
  message: 'bg-purple-100 text-purple-700',
  whatsapp: 'bg-green-100 text-green-700',
  sms: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
}

export default function MessagesPage() {
  const [rows, setRows] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/messages')
    setRows(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this record?')) return
    await fetch('/api/messages', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="text-purple-600" size={22} /> Messages & Emails</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all inbound and outbound communications</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <ExportButton table="messages" />
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Log Message / Email</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Type *</label>
              <select required className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="email">Email</option>
                <option value="message">Message</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Direction *</label>
              <select required className="input" value={form.direction} onChange={e => set('direction', e.target.value)}>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            <div><label className="label">Date *</label><input required type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className="label">Sender</label><input className="input" value={form.sender} onChange={e => set('sender', e.target.value)} /></div>
            <div><label className="label">Recipient</label><input className="input" value={form.recipient} onChange={e => set('recipient', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
            <div><label className="label">Engineer / Handled by</label><input className="input" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} /></div>
            <div><label className="label">Tags (comma-separated)</label><input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
            <div className="md:col-span-3"><label className="label">Summary / Body</label><textarea rows={3} className="input" value={form.body_summary} onChange={e => set('body_summary', e.target.value)} /></div>
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
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={24} /></div>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No messages logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Date','Type','Direction','From','To','Company','Subject','Summary','Engineer',''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td whitespace-nowrap">{r.date}</td>
                  <td className="table-td">
                    <span className={`badge ${TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-700'}`}>{r.type}</span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${r.direction === 'inbound' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>{r.direction}</span>
                  </td>
                  <td className="table-td">{r.sender ?? '—'}</td>
                  <td className="table-td">{r.recipient ?? '—'}</td>
                  <td className="table-td">{r.company ?? '—'}</td>
                  <td className="table-td max-w-xs truncate">{r.subject ?? '—'}</td>
                  <td className="table-td max-w-xs truncate">{r.body_summary ?? '—'}</td>
                  <td className="table-td">{r.engineer_name ?? '—'}</td>
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
