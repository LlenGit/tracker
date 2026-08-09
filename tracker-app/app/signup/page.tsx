'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)

    const { error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (authErr) { setError(authErr.message); setLoading(false); return }

    router.push('/pending')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">FieldTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Request access to the tracker</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Full Name</label>
            <input required className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={8} className="input" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />} Request Access
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have access?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Your account will be reviewed before access is granted.
        </p>
      </div>
    </div>
  )
}
