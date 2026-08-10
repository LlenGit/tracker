'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Phone, Loader2, Upload, Play, Pause, Pencil } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { Call } from '@/lib/supabase'

const EMPTY: Omit<Call, 'id' | 'created_at'> = {
  client_name: '', company: '', phone: '', date: new Date().toISOString().slice(0, 10),
  time: '', duration_min: undefined, engineer_name: '', notes: '', recording_url: '', tags: '',
}

function AudioPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLAudioElement>(null)
  const toggle = () => {
    if (!ref.current) return
    if (playing) { ref.current.pause(); setPlaying(false) }
    else { ref.current.play(); setPlaying(true) }
  }
  return (
    <div className="flex items-center gap-1">
      <audio ref={ref} src={url} onEnded={() => setPlaying(false)} preload="none" />
      <button onClick={toggle} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
        {playing ? <Pause size={13} /> : <Play size={13} />}
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/calls')
      const data = await res.json()
      setCalls(Array.isArray(data) ? data : [])
    } catch { setCalls([]) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    setForm({ ...EMPTY })
    setEditId(null)
    setAudioFile(null)
    setShowForm(true)
  }

  const openEdit = (c: Call) => {
    const { id, created_at, ...fields } = c
    setForm({ ...EMPTY, ...fields })
    setEditId(id!)
    setAudioFile(null)
    setShowForm(true)
  }

  const cancel = () => {
    setShowForm(false)
    setEditId(null)
    setForm({ ...EMPTY })
    setAudioFile(null)
  }

  const uploadAudio = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('recordings').upload(path, file, { upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('recordings').getPublicUrl(path)
    return data.publicUrl
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    let url = form.recording_url
    if (audioFile) {
      setUploading(true)
      try { url = await uploadAudio(audioFile) } catch { alert('Audio upload failed — check your Supabase Storage bucket.') }
      setUploading(false)
    }
    const payload = { ...form, recording_url: url }
    if (editId) {
      await apiFetch('/api/calls', { method: 'PATCH', body: JSON.stringify({ id: editId, ...payload }) })
    } else {
      await apiFetch('/api/calls', { method: 'POST', body: JSON.stringify(payload) })
    }
    setSaving(false)
    cancel()
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this call log?')) return
    await apiFetch('/api/calls', { method: 'DELETE', body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="text-blue-600" size={22} /> Calls</h1>
          <p className="text-sm text-gray-500 mt-0.5">Log client calls, recordings, and notes</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <ExportButton table="calls" />
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Call
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{editId ? 'Edit Call' : 'Log a Call'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Client Name *</label><input required className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} /></div>
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Date *</label><input required type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className="label">Time</label><input type="time" className="input" value={form.time} onChange={e => set('time', e.target.value)} /></div>
            <div><label className="label">Duration (min)</label><input type="number" min={0} className="input" value={form.duration_min ?? ''} onChange={e => set('duration_min', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
            <div><label className="label">Engineer Name</label><input className="input" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} /></div>
            <div>
              <label className="label">Recording (audio file)</label>
              <label className="input flex items-center gap-2 cursor-pointer text-gray-500 hover:bg-gray-50">
                <Upload size={14} />
                {audioFile ? audioFile.name : (form.recording_url ? 'Replace recording…' : 'Choose MP3, WAV, M4A…')}
                <input type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] ?? null)} />
              </label>
              {audioFile && <button type="button" onClick={() => setAudioFile(null)} className="text-xs text-red-400 mt-1 hover:text-red-600">Remove</button>}
            </div>
            <div><label className="label">Tags (comma-separated)</label><input className="input" placeholder="important, follow-up" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
            <div className="md:col-span-3"><label className="label">Notes</label><textarea rows={3} className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end items-center">
            {uploading && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Uploading audio…</span>}
            <button type="button" onClick={cancel} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} {editId ? 'Save Changes' : 'Save Call'}
            </button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={24} /></div>
        ) : calls.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No calls logged yet. Add one above.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Client', 'Company', 'Engineer', 'Duration', 'Notes', 'Recording', ''].map(h => (
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
                      {c.recording_url ? <AudioPlayer url={c.recording_url} /> : '—'}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => del(c.id!)} className="text-red-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 text-center py-2">{calls.length} records</p>
          </>
        )}
      </div>
    </div>
  )
}
