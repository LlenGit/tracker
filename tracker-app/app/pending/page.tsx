'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Clock } from 'lucide-react'

export default function PendingPage() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (profile?.status === 'approved') router.push('/dashboard')
  }, [profile, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center card space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock size={28} className="text-yellow-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Pending Approval</h2>
        <p className="text-gray-500 text-sm">
          Your account has been created and is awaiting approval from the administrator.
          You will be able to sign in once your access is approved.
        </p>
        <p className="text-xs text-gray-400">Signed in as <span className="font-medium">{profile?.email}</span></p>
        <button
          onClick={async () => { await signOut(); router.push('/login') }}
          className="btn-secondary w-full"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
