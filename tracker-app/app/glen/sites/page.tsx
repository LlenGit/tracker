'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, MapPin, Loader2, Wind } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { GlenSite } from '@/lib/supabase'

const EMPTY: Omit<GlenSite, 'id' | 'created_at'> = {
  company: '', plant_site: '', location_name: '', station_type: 'Ambient',
  data_logger_id: '', analyzer_type: '', parameter: '', signal_ip: '',
  make: '', model: '', serial_number: '', status: 'Active',
  commissioned_date: '', notes: '', tags: '',
}

const STATUS_BADGE: Record<string, string> = {
  'Active':            'bg-green-100 text-green-700',
  'Offline':           'bg-red-100 text-red-700',
  'Under Maintenance': 'bg-yellow-100 text-yellow-800',
  'Decommissioned':    'bg-gray-100 text-gray-500',
}

const PARAMETERS = ['PM10','PM2.5','NOx','SO2','CO','SPM','NH3','O3','Pb','H2S','Temp','Humidity','Wind Speed','Wind Direction']

export default function GlenSitesPage() {
  const [rows, setRows] = useState<GlenSite[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [filterPlant, setFilterPlant] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/glen/sites')
    setRows(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, commissioned_date: form.commissioned_date || null }
    await fetch('/api/glen/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/glen/sites', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this site record?')) return
    await fetch('/api/glen/sites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const plants = rows.map(r => r.plant_site).filter((v, i, a) => a.indexOf(v) === i).sort()
  const filtered = rows.filter(r => {
    if (filterPlant && r.plant_site !== filterPlant) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  const offlineCount = rows.filter(r => r.status === 'Offline').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wind className="text-teal-600" size={22} /> CAAQMS Monitoring Sites</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ambient & stack monitoring stations — parameters, data loggers, analyzers</p>
        </div>
        <div className="flex gap-2">
          <ExportButton table="glen_sites" label="Export CSV" />
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Station
          </button>
        </div>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'Active', 'Offline', 'Under Maintenance', 'Decommissioned'] as const).map(s => {
          const cnt = s === 'all' ? rows.length : rows.filter(r => r.status === s).length
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${filterStatus === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? `All (${cnt})` : `${s} (${cnt})`}
            </button>
          )
        })}
        {offlineCount > 0 && (
          <span className="badge bg-red-100 text-red-700 ml-2">{offlineCount} offline</span>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Add Monitoring Station</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Company *</label><input required className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Plant / Site *</label><input required className="input" placeholder="e.g. Tata Steel Meramandali" value={form.plant_site} onChange={e => set('plant_site', e.target.value)} /></div>
            <div><label className="label">Location Name *</label><input required className="input" placeholder="e.g. CAAQMS_01, Stack_15_Coke_Oven" value={form.location_name} onChange={e => set('location_name', e.target.value)} /></div>
            <div>
              <label className="label">Station Type</label>
              <select className="input" value={form.station_type} onChange={e => set('station_type', e.target.value)}>
                <option>Ambient</option>
                <option>Stack</option>
                <option>CEQMS</option>
                <option>AEL</option>
                <option>CAAQMS</option>
                <option>Other</option>
              </select>
            </div>
            <div><label className="label">Data Logger ID</label><input className="input" value={form.data_logger_id} onChange={e => set('data_logger_id', e.target.value)} /></div>
            <div><label className="label">Analyzer Type</label><input className="input" value={form.analyzer_type} onChange={e => set('analyzer_type', e.target.value)} /></div>
            <div>
              <label className="label">Parameter</label>
              <select className="input" value={form.parameter} onChange={e => set('parameter', e.target.value)}>
                <option value="">Select…</option>
                {PARAMETERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Signal / IP</label><input className="input" placeholder="192.168.x.x or signal name" value={form.signal_ip} onChange={e => set('signal_ip', e.target.value)} /></div>
            <div><label className="label">Make</label><input className="input" value={form.make} onChange={e => set('make', e.target.value)} /></div>
            <div><label className="label">Model</label><input className="input" value={form.model} onChange={e => set('model', e.target.value)} /></div>
            <div><label className="label">Serial Number</label><input className="input" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Active</option>
                <option>Offline</option>
                <option>Under Maintenance</option>
                <option>Decommissioned</option>
              </select>
            </div>
            <div><label className="label">Commissioned Date</label><input type="date" className="input" value={form.commissioned_date} onChange={e => set('commissioned_date', e.target.value)} /></div>
            <div className="md:col-span-3"><label className="label">Notes</label><textarea rows={2} className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save Station
            </button>
          </div>
        </form>
      )}

      {/* Plant filter */}
      {plants.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase">Plant:</span>
          <button onClick={() => setFilterPlant('')} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterPlant ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {plants.map(p => (
            <button key={p} onClick={() => setFilterPlant(p)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterPlant === p ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No stations added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>{['Location','Company / Plant','Type','Parameter','Data Logger','Analyzer','Make / Model','Signal / IP','Status',''].map(h=>(
                <th key={h} className="table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.status === 'Decommissioned' ? 'opacity-50' : ''}`}>
                  <td className="table-td font-semibold text-teal-800">{r.location_name}</td>
                  <td className="table-td">
                    <span className="font-medium">{r.company}</span>
                    {r.plant_site && <span className="block text-xs text-gray-400">{r.plant_site}</span>}
                  </td>
                  <td className="table-td"><span className="badge bg-teal-50 text-teal-700">{r.station_type ?? '—'}</span></td>
                  <td className="table-td font-medium text-xs">{r.parameter ?? '—'}</td>
                  <td className="table-td text-xs font-mono">{r.data_logger_id ?? '—'}</td>
                  <td className="table-td text-xs">{r.analyzer_type ?? '—'}</td>
                  <td className="table-td text-xs">{[r.make, r.model].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="table-td text-xs font-mono">{r.signal_ip ?? '—'}</td>
                  <td className="table-td">
                    <select value={r.status ?? 'Active'} onChange={e => updateStatus(r.id!, e.target.value)}
                      className={`badge cursor-pointer border-0 text-xs font-medium rounded px-2 py-0.5 ${STATUS_BADGE[r.status ?? 'Active']}`}>
                      {['Active','Offline','Under Maintenance','Decommissioned'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
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
