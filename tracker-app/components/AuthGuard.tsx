'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Loader2 } from 'lucide-react'

const PUBLIC_PATHS = ['/login', '/signup', '/pending']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (loading) return

    if (!user && !isPublic) {
      router.replace('/login')
      return
    }

    if (user && profile) {
      if (profile.status === 'pending' && pathname !== '/pending') {
        router.replace('/pending')
        return
      }
      if (profile.status === 'rejected' && !isPublic) {
        router.replace('/login')
        return
      }
      if (profile.status === 'approved' && isPublic && pathname !== '/pending') {
        router.replace('/dashboard')
        return
      }
    }
  }, [user, profile, loading, pathname, isPublic, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  // Show public pages always
  if (isPublic) return <>{children}</>

  // Show protected pages only when approved
  if (user && profile?.status === 'approved') return <>{children}</>

  // Blank while redirecting
  return null
}
