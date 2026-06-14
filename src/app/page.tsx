'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import AuthScreen from '@/components/auth-screen'
import AppScreen from '@/components/app-screen'
import Image from 'next/image'

function AppContent() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f5ff' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-gray-100 shadow-sm">
            <Image
              src="/dforzze-logo.png"
              alt="Dforzze"
              width={64}
              height={64}
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <p className="text-[#6b7280] text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  return <AppScreen />
}

export default function Home() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}
