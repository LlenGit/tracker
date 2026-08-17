'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    // Check approval status
    const { data: profile } = await supabase
      .from('profiles').select('status').eq('id', data.user.id).single()

    if (profile?.status === 'pending') {
      router.push('/pending')
    } else if (profile?.status === 'rejected') {
      await supabase.auth.signOut()
      setError('Your account access has been denied. Contact the administrator.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">FieldTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />} Sign In
          </button>
          <p className="text-center text-sm text-gray-500">
            No account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">Request access</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
