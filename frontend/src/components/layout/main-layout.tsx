'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto px-8 py-8 max-w-screen-2xl mx-auto w-full">
          <div className="space-y-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}