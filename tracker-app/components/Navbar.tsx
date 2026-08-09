'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Phone, Mail, MapPin, CheckSquare, Search, TrendingUp, Wifi } from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Dashboard',   icon: TrendingUp },
  { href: '/',             label: 'Search',       icon: Search },
  { href: '/calls',        label: 'Calls',        icon: Phone },
  { href: '/messages',     label: 'Messages',     icon: Mail },
  { href: '/site-visits',  label: 'Site Visits',  icon: MapPin },
  { href: '/activities',   label: 'Activities',   icon: CheckSquare },
  { href: '/glen',         label: 'GLEN',         icon: Wifi },
]

export default function Navbar() {
  const path = usePathname()
  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-bold text-lg mr-6 tracking-tight">FieldTracker</span>
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${path === href
                ? 'bg-blue-700 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
