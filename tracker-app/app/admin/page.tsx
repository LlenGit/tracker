'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'


interface Profile {
  id: string
  email: string
  full_name?: string
  status: 'pending' | 'approved' | 'rejected'
  role: string
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const isMaster = profile?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
    setProfiles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (!isMaster) { router.push('/dashboard'); return }
    load()
  }, [authLoading, user, isMaster, router, load])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdating(id)
    await supabase.from('profiles').update({ status }).eq('id', id)
    setUpdating(null)
    load()
  }

  if (authLoading || loading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="animate-spin text-blue-600" size={28} />
    </div>
  )

  const pending  = profiles.filter(p => p.status === 'pending')
  const approved = profiles.filter(p => p.status === 'approved')
  const rejected = profiles.filter(p => p.status === 'rejected')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Approve or reject access requests</p>
      </div>

      {/* Pending */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Clock size={16} className="text-yellow-500" /> Pending Approval
          {pending.length > 0 && <span className="badge bg-yellow-100 text-yellow-800 ml-1">{pending.length}</span>}
        </h2>
        {pending.length === 0
          ? <p className="text-gray-400 text-sm">No pending requests.</p>
          : pending.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3">
              <div>
                <p className="font-medium text-gray-800">{p.full_name || '—'}</p>
                <p className="text-sm text-gray-500">{p.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(p.id, 'approved')}
                  disabled={updating === p.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg"
                >
                  {updating === p.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                </button>
                <button
                  onClick={() => updateStatus(p.id, 'rejected')}
                  disabled={updating === p.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Approved */}
      {approved.length > 0 && (
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Approved Users
          </h2>
          {approved.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-800 text-sm">{p.full_name || '—'} <span className="text-gray-400">·</span> <span className="text-gray-500 text-sm">{p.email}</span></p>
              </div>
              <button
                onClick={() => updateStatus(p.id, 'rejected')}
                disabled={updating === p.id}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <XCircle size={16} className="text-red-400" /> Rejected
          </h2>
          {rejected.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <p className="text-sm text-gray-500">{p.full_name || '—'} · {p.email}</p>
              <button
                onClick={() => updateStatus(p.id, 'approved')}
                disabled={updating === p.id}
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                Re-approve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
