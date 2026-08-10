'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Phone, Mail, MapPin, CheckSquare, Search, TrendingUp, Wifi, LogOut, ShieldCheck, Menu, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const nav = [
  { href: '/dashboard',   label: 'Dashboard',  icon: TrendingUp },
  { href: '/',            label: 'Search',      icon: Search },
  { href: '/calls',       label: 'Calls',       icon: Phone },
  { href: '/messages',    label: 'Messages',    icon: Mail },
  { href: '/site-visits', label: 'Site Visits', icon: MapPin },
  { href: '/activities',  label: 'Activities',  icon: CheckSquare },
  { href: '/glen',        label: 'GLENS',       icon: Wifi },
]

export default function Navbar() {
  const path    = usePathname()
  const router  = useRouter()
  const { user, profile, signOut } = useAuth()
  const isMaster = profile?.role === 'admin'
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const linkClass = (href: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      path === href ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
    }`

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main bar */}
        <div className="flex items-center h-14">
          <span className="font-bold text-lg tracking-tight mr-4">FieldTracker</span>

          {/* Desktop nav — only shown when logged in */}
          {user && (
            <div className="hidden md:flex items-center gap-1 flex-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={linkClass(href)}>
                  <Icon size={15} />{label}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-1">
                {isMaster && (
                  <Link href="/admin" className={linkClass('/admin')}>
                    <ShieldCheck size={15} /> Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Mobile hamburger — only shown when logged in */}
          {user && (
            <button onClick={() => setOpen(v => !v)} className="md:hidden ml-auto p-2 rounded text-blue-200 hover:bg-blue-800">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Mobile menu */}
        {user && open && (
          <div className="md:hidden pb-3 space-y-1 border-t border-blue-800 pt-2">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium w-full transition-colors ${
                  path === href ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}>
                <Icon size={15} />{label}
              </Link>
            ))}
            {isMaster && (
              <Link href="/admin" onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium w-full transition-colors ${
                  path === '/admin' ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}>
                <ShieldCheck size={15} /> Admin
              </Link>
            )}
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium w-full text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
