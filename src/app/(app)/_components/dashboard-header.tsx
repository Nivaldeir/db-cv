"use client"

import { useAuth } from "@/contexts/auth-context"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

function getFirstName(name: string) {
  return name.split(" ")[0] || name
}

export function DashboardHeader() {
  const { user } = useAuth()

  const greeting = getGreeting()
  const firstName = user ? getFirstName(user.name) : ""
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
        {greeting}{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-sm text-muted-foreground">{todayCapitalized}</p>
    </div>
  )
}
