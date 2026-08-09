import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import AuthGuard from '@/components/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FieldTracker — Activity & Site Visit Tracker',
  description: 'Track calls, messages, emails, site visits, gatepasses, and activities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-6">
              {children}
            </main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
