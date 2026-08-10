'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Key, Loader2, Eye, EyeOff, ExternalLink, Pencil } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import { apiFetch } from '@/lib/api'
import type { GlenPortal } from '@/lib/supabase'

const EMPTY: Omit<GlenPortal, 'id' | 'created_at'> = {
  company: '', plant_site: '', system_name: '', login_type: '',
  url: '', username: '', password: '', access_scope: '', remark: '', tags: '',
}

export default function GlenPortalsPage() {
  const [rows, setRows] = useState<GlenPortal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [showPassFor, setShowPassFor] = useState<string | null>(null)
  const [filterCompany, setFilterCompany] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/glen/portals')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch { setRows([]) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true) }

  const openEdit = (r: GlenPortal) => {
    const { id, created_at, ...fields } = r
    setForm({ ...EMPTY, ...fields })
    setEditId(id!)
    setShowForm(true)
  }

  const cancel = () => { setShowForm(false); setEditId(null); setForm({ ...EMPTY }) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (editId) {
      await apiFetch('/api/glen/portals', { method: 'PATCH', body: JSON.stringify({ id: editId, ...form }) })
    } else {
      await apiFetch('/api/glen/portals', { method: 'POST', body: JSON.stringify(form) })
    }
    setSaving(false)
    cancel()
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this portal entry?')) return
    await apiFetch('/api/glen/portals', { method: 'DELETE', body: JSON.stringify({ id }) })
    load()
  }

  const companies = rows.map(r => r.company).filter((v, i, a) => a.indexOf(v) === i).sort()
  const systems = rows.map(r => r.system_name).filter((v, i, a) => a.indexOf(v) === i).sort()
  const filtered = filterCompany ? rows.filter(r => r.company === filterCompany) : rows

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="text-cyan-600" size={22} /> Portal Logins</h1>
          <p className="text-sm text-gray-500 mt-0.5">G-Lens, iLens, OSPCB RTDAS, IoT Manager credentials</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <ExportButton table="glen_portals" label="Export CSV" />
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Portal
          </button>
        </div>
      </div>

      {systems.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase">Systems:</span>
          {systems.map(s => (
            <span key={s} className="badge bg-cyan-50 text-cyan-700 border border-cyan-200">{s}</span>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{editId ? 'Edit Portal Credential' : 'Add Portal Credential'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Company *</label><input required className="input" placeholder="e.g. Tata Steel" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Plant / Site</label><input className="input" placeholder="e.g. Meramandali" value={form.plant_site} onChange={e => set('plant_site', e.target.value)} /></div>
            <div>
              <label className="label">System / Portal *</label>
              <select required className="input" value={form.system_name} onChange={e => set('system_name', e.target.value)}>
                <option value="">Select…</option>
                <option>G-Lens</option><option>TATA BSL iLens</option>
                <option>OSPCB RTDAS</option><option>IoT Manager</option><option>Other</option>
              </select>
            </div>
            <div><label className="label">Login Type</label><input className="input" placeholder="Admin / User / Operator" value={form.login_type} onChange={e => set('login_type', e.target.value)} /></div>
            <div><label className="label">URL</label><input className="input" placeholder="trial.glensserver.com" value={form.url} onChange={e => set('url', e.target.value)} /></div>
            <div><label className="label">Access Scope</label><input className="input" placeholder="Full Admin / SN 1-10" value={form.access_scope} onChange={e => set('access_scope', e.target.value)} /></div>
            <div><label className="label">Username</label><input className="input" value={form.username} onChange={e => set('username', e.target.value)} /></div>
            <div><label className="label">Password</label><input className="input" type="text" value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <div><label className="label">Remark</label><input className="input" value={form.remark} onChange={e => set('remark', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancel} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} {editId ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {companies.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase">Filter:</span>
          <button onClick={() => setFilterCompany('')} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterCompany ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {companies.map(c => (
            <button key={c} onClick={() => setFilterCompany(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCompany === c ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-cyan-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No portal credentials added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>{['#', 'System', 'Company / Site', 'Login Type', 'URL', 'Username', 'Password', 'Access', 'Remark', ''].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td text-gray-400">{i + 1}</td>
                  <td className="table-td font-semibold text-cyan-800">{r.system_name}</td>
                  <td className="table-td">
                    <span className="font-medium">{r.company}</span>
                    {r.plant_site && <span className="text-gray-400 block text-xs">{r.plant_site}</span>}
                  </td>
                  <td className="table-td">{r.login_type ?? '—'}</td>
                  <td className="table-td">
                    {r.url ? (
                      <a href={`https://${r.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                        <ExternalLink size={11} />{r.url}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="table-td font-mono text-xs">{r.username ?? '—'}</td>
                  <td className="table-td font-mono text-xs">
                    <div className="flex items-center gap-1">
                      {showPassFor === r.id ? r.password : '••••••••'}
                      {r.password && (
                        <button onClick={() => setShowPassFor(showPassFor === r.id ? null : r.id!)} className="text-gray-400 hover:text-gray-600">
                          {showPassFor === r.id ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="table-td text-xs">{r.access_scope ?? '—'}</td>
                  <td className="table-td text-xs text-gray-400">{r.remark ?? '—'}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                      <button onClick={() => del(r.id!)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
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
