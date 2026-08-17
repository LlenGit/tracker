'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2, Clock } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

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

    setLoading(false)
    if (authErr) {
      setError(authErr.message || 'Signup failed. Please try again.')
      return
    }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center card space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock size={28} className="text-yellow-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Request Submitted</h2>
        <p className="text-gray-500 text-sm">
          Your account has been created and is pending approval from the administrator.
          Once approved, you can sign in with your credentials.
        </p>
        <p className="text-xs text-gray-400">Signed up as <span className="font-medium">{email}</span></p>
        <Link href="/login" className="btn-primary block text-center w-full">Back to Sign In</Link>
      </div>
    </div>
  )

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
