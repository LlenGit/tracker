'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, MapPin, Loader2, ShieldCheck } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { SiteVisit } from '@/lib/supabase'

const EMPTY: Omit<SiteVisit, 'id' | 'created_at'> = {
  company: '', plant_site: '', location: '', visit_date: new Date().toISOString().slice(0,10),
  engineer_name: '', purpose: '', gatepass_docs: '', gatepass_validity: '',
  escort_required: false, ppe_required: '', notes: '', tags: '',
}

export default function SiteVisitsPage() {
  const [rows, setRows] = useState<SiteVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [filterCompany, setFilterCompany] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/site-visits')
    setRows(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/site-visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this visit log?')) return
    await fetch('/api/site-visits', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const companies = [...new Set(rows.map(r => r.company))].sort()
  const filtered = filterCompany ? rows.filter(r => r.company === filterCompany) : rows

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="text-green-600" size={22} /> Site Visits & Gatepasses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track plant visits, gatepass documents, and engineer history</p>
        </div>
        <div className="flex gap-2">
          <ExportButton table="site_visits" />
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Log Visit
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Log Site Visit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Company *</label><input required className="input" placeholder="e.g. Hindalco" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Plant / Site Name *</label><input required className="input" placeholder="e.g. Mahan Plant" value={form.plant_site} onChange={e => set('plant_site', e.target.value)} /></div>
            <div><label className="label">Location</label><input className="input" placeholder="e.g. Singrauli, MP" value={form.location} onChange={e => set('location', e.target.value)} /></div>
            <div><label className="label">Visit Date *</label><input required type="date" className="input" value={form.visit_date} onChange={e => set('visit_date', e.target.value)} /></div>
            <div><label className="label">Engineer Name *</label><input required className="input" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} /></div>
            <div><label className="label">Purpose of Visit</label><input className="input" value={form.purpose} onChange={e => set('purpose', e.target.value)} /></div>
            <div className="md:col-span-2">
              <label className="label">Gatepass Documents Required</label>
              <input className="input" placeholder="e.g. Aadhar Card, Company ID, Medical Fitness, Safety Induction" value={form.gatepass_docs} onChange={e => set('gatepass_docs', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Separate each document with a comma</p>
            </div>
            <div><label className="label">Gatepass Validity</label><input className="input" placeholder="e.g. 1 day, 6 months" value={form.gatepass_validity} onChange={e => set('gatepass_validity', e.target.value)} /></div>
            <div>
              <label className="label">PPE Required</label>
              <input className="input" placeholder="e.g. Helmet, Safety Shoes, Gloves" value={form.ppe_required} onChange={e => set('ppe_required', e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="escort" checked={form.escort_required} onChange={e => set('escort_required', e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
              <label htmlFor="escort" className="text-sm font-medium text-gray-700">Escort Required</label>
            </div>
            <div><label className="label">Tags</label><input className="input" placeholder="hindalco, annual" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
            <div className="md:col-span-3"><label className="label">Notes</label><textarea rows={3} className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save Visit
            </button>
          </div>
        </form>
      )}

      {/* Filter by company */}
      {companies.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Filter by company:</span>
          <button onClick={() => setFilterCompany('')} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterCompany ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {companies.map(c => (
            <button key={c} onClick={() => setFilterCompany(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCompany === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No site visits logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Date','Company','Plant / Site','Location','Engineer','Purpose','Gatepass Docs','PPE','Escort',''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td whitespace-nowrap">{r.visit_date}</td>
                  <td className="table-td font-semibold text-green-800">{r.company}</td>
                  <td className="table-td font-medium">{r.plant_site}</td>
                  <td className="table-td">{r.location ?? '—'}</td>
                  <td className="table-td">{r.engineer_name}</td>
                  <td className="table-td">{r.purpose ?? '—'}</td>
                  <td className="table-td max-w-xs">
                    {r.gatepass_docs
                      ? <div className="flex flex-wrap gap-1">{r.gatepass_docs.split(',').map(d => (
                          <span key={d} className="badge bg-yellow-100 text-yellow-800"><ShieldCheck size={10} className="mr-1" />{d.trim()}</span>
                        ))}</div>
                      : '—'}
                  </td>
                  <td className="table-td">{r.ppe_required ?? '—'}</td>
                  <td className="table-td">{r.escort_required ? '✅ Yes' : 'No'}</td>
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
