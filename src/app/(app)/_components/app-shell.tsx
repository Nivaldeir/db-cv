"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { useAuth } from "@/contexts/auth-context"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user ?? { name: "", email: "" }} onLogout={logout} />
      <main className="flex-1 overflow-y-auto">
        <div
          key={pathname}
          className="p-6 lg:p-8 animate-fade-in"
        >
          {children}
        </div>
      </main>
    </div>
  )
}
