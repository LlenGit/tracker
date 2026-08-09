'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, MapPin, Loader2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import type { SiteVisit } from '@/lib/supabase'

const EMPTY: Omit<SiteVisit, 'id' | 'created_at'> = {
  company: '', plant_site: '', location: '', visit_date: new Date().toISOString().slice(0,10),
  engineer_name: '', purpose: '', gatepass_docs: '', gatepass_validity: '',
  escort_required: false, ppe_required: '',
  docs_contractor: '', docs_workmen: '', docs_medical: '', docs_safety: '',
  notes: '', tags: '',
}

const DOC_PLACEHOLDERS = {
  docs_contractor: 'ESI Certificate, PF Registration, Valid PO/LOI, GST Certificate, PAN Card, Power of Attorney, Cancelled Cheque, Indemnity Bond…',
  docs_workmen:    'Age Proof, Aadhar Card, E-Pehchan/TIC, UAN Number, Passport Photos (4), Bank Passbook, WC Policy, Interview Assessment Sheet…',
  docs_medical:    'Form 31 A, Form 25, Vision Test, ECG, Audio, Spirometry, CBC, Biochemistry, Urine Report, Chest X-Ray…',
  docs_safety:     'HSE Induction Training Form, Safety Clearance Form, PPEs Issue Form, Interview Assessment Sheet, PO Copy, Induction Data…',
}

function DocBadges({ text }: { text?: string }) {
  if (!text) return <span className="text-gray-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {text.split(',').map(d => d.trim()).filter(Boolean).map(d => (
        <span key={d} className="badge bg-yellow-100 text-yellow-800">
          <ShieldCheck size={10} className="mr-1 inline" />{d}
        </span>
      ))}
    </div>
  )
}

function ExpandableRow({ r, onDelete }: { r: SiteVisit; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const hasDocs = r.docs_contractor || r.docs_workmen || r.docs_medical || r.docs_safety
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <td className="table-td whitespace-nowrap">{r.visit_date}</td>
        <td className="table-td font-semibold text-green-800">{r.company}</td>
        <td className="table-td font-medium">{r.plant_site}</td>
        <td className="table-td">{r.location ?? '—'}</td>
        <td className="table-td">{r.engineer_name}</td>
        <td className="table-td">{r.purpose ?? '—'}</td>
        <td className="table-td">{r.ppe_required ?? '—'}</td>
        <td className="table-td">{r.escort_required ? 'Yes' : 'No'}</td>
        <td className="table-td">
          {hasDocs
            ? <span className="text-xs text-blue-600 flex items-center gap-1">{open ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} View docs</span>
            : <span className="text-gray-400 text-xs">—</span>
          }
        </td>
        <td className="table-td" onClick={e => e.stopPropagation()}>
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={15} />
          </button>
        </td>
      </tr>
      {open && hasDocs && (
        <tr className="bg-gray-50 border-t border-gray-100">
          <td colSpan={10} className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {r.docs_contractor && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Contractor Registration</p>
                  <DocBadges text={r.docs_contractor} />
                </div>
              )}
              {r.docs_workmen && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Workmen Profile</p>
                  <DocBadges text={r.docs_workmen} />
                </div>
              )}
              {r.docs_medical && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Medical Examination</p>
                  <DocBadges text={r.docs_medical} />
                </div>
              )}
              {r.docs_safety && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Safety Induction</p>
                  <DocBadges text={r.docs_safety} />
                </div>
              )}
              {r.gatepass_docs && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Other / General Docs</p>
                  <DocBadges text={r.gatepass_docs} />
                </div>
              )}
              {r.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                  <p className="text-gray-700 text-xs">{r.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
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

  const companies = rows.map(r => r.company).filter((v, i, a) => a.indexOf(v) === i).sort()
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
        <form onSubmit={submit} className="card space-y-5">
          <h2 className="font-semibold text-gray-800">Log Site Visit</h2>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Company *</label><input required className="input" placeholder="e.g. HIL, Hindalco" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="label">Plant / Site *</label><input required className="input" placeholder="e.g. Lapanga, Mahan" value={form.plant_site} onChange={e => set('plant_site', e.target.value)} /></div>
            <div><label className="label">Location</label><input className="input" placeholder="e.g. Sambalpur, Odisha" value={form.location} onChange={e => set('location', e.target.value)} /></div>
            <div><label className="label">Visit Date *</label><input required type="date" className="input" value={form.visit_date} onChange={e => set('visit_date', e.target.value)} /></div>
            <div><label className="label">Engineer Name *</label><input required className="input" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} /></div>
            <div><label className="label">Purpose of Visit</label><input className="input" value={form.purpose} onChange={e => set('purpose', e.target.value)} /></div>
            <div><label className="label">Gatepass Validity</label><input className="input" placeholder="e.g. 1 day, 6 months" value={form.gatepass_validity} onChange={e => set('gatepass_validity', e.target.value)} /></div>
            <div><label className="label">PPE Required</label><input className="input" placeholder="Helmet, Safety Shoes, Gloves" value={form.ppe_required} onChange={e => set('ppe_required', e.target.value)} /></div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="escort" checked={form.escort_required} onChange={e => set('escort_required', e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
              <label htmlFor="escort" className="text-sm font-medium text-gray-700">Escort Required</label>
            </div>
          </div>

          {/* Gatepass Document Categories */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 border-t pt-4">Gatepass Documents Required <span className="text-gray-400 font-normal">(comma-separated per category)</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contractor Registration Docs</label>
                <textarea rows={3} className="input text-xs" placeholder={DOC_PLACEHOLDERS.docs_contractor} value={form.docs_contractor} onChange={e => set('docs_contractor', e.target.value)} />
              </div>
              <div>
                <label className="label">Workmen Profile Docs</label>
                <textarea rows={3} className="input text-xs" placeholder={DOC_PLACEHOLDERS.docs_workmen} value={form.docs_workmen} onChange={e => set('docs_workmen', e.target.value)} />
              </div>
              <div>
                <label className="label">Medical Examination Docs</label>
                <textarea rows={3} className="input text-xs" placeholder={DOC_PLACEHOLDERS.docs_medical} value={form.docs_medical} onChange={e => set('docs_medical', e.target.value)} />
              </div>
              <div>
                <label className="label">Safety Induction Docs</label>
                <textarea rows={3} className="input text-xs" placeholder={DOC_PLACEHOLDERS.docs_safety} value={form.docs_safety} onChange={e => set('docs_safety', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Other / General Docs</label>
                <input className="input text-xs" placeholder="Any additional documents not covered above" value={form.gatepass_docs} onChange={e => set('gatepass_docs', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div><label className="label">Tags</label><input className="input" placeholder="hindalco, annual" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
            <div><label className="label">Notes</label><textarea rows={2} className="input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Save Visit
            </button>
          </div>
        </form>
      )}

      {companies.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase">Filter:</span>
          <button onClick={() => setFilterCompany('')} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterCompany ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {companies.map(c => (
            <button key={c} onClick={() => setFilterCompany(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCompany === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No site visits logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Date','Company','Plant / Site','Location','Engineer','Purpose','PPE','Escort','Docs',''].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <ExpandableRow key={r.id} r={r} onDelete={() => del(r.id!)} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
