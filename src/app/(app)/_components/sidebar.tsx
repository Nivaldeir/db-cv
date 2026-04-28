"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Calendar,
  FolderKanban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ActivePage = "dashboard" | "candidatos" | "vagas" | "pipeline" | "relatorios" | "configuracoes"

interface SidebarProps {
  user: {
    name: string
    email: string
  }
  onLogout: () => void
}

interface NavItem {
  id: ActivePage | string
  label: string
  icon: React.ElementType
  comingSoon?: boolean
  href?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    title: "RECRUTAMENTO",
    items: [
      { id: "candidatos", label: "Candidatos", icon: Users, href: "/candidatos" },
      { id: "vagas", label: "Vagas", icon: Briefcase, comingSoon: true },
      { id: "pipeline", label: "Pipeline", icon: FolderKanban, comingSoon: true },
    ],
  },
  {
    title: "GESTÃO",
    items: [
      { id: "relatorios", label: "Relatórios", icon: BarChart3, comingSoon: true },
      { id: "entrevistas", label: "Entrevistas", icon: Calendar, comingSoon: true },
      { id: "emails", label: "Templates Email", icon: Mail, comingSoon: true },
    ],
  },
]

const footerItems: NavItem[] = [
  { id: "notificacoes", label: "Notificações", icon: Bell, comingSoon: true },
  { id: "configuracoes", label: "Configurações", icon: Settings, href: "/configuracoes" },
]

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : item.href
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : false

    const baseClass = cn(
      "group w-full justify-start gap-3 h-10 px-3 rounded-md",
      "text-sidebar-foreground/65 transition-all duration-150",
      "hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
      isActive && "bg-primary/10 text-primary hover:bg-primary/12 hover:text-primary font-medium",
      collapsed && "justify-center px-0 w-10 mx-auto"
    )

    const iconClass = cn(
      "h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:scale-[1.08]",
      isActive && "text-primary"
    )

    const labelContent = (
      <div
        className={cn(
          "flex items-center gap-2 overflow-hidden transition-all duration-200",
          collapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
        )}
      >
        <span className="text-sm whitespace-nowrap">{item.label}</span>
        {item.comingSoon && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-border/50 text-muted-foreground/70 font-normal whitespace-nowrap leading-none">
            em breve
          </span>
        )}
      </div>
    )

    const buttonContent = (
      <>
        <Icon className={iconClass} />
        {labelContent}
      </>
    )

    const button =
      item.comingSoon || !item.href ? (
        <Button
          variant="ghost"
          className={baseClass}
          disabled={item.comingSoon}
        >
          {buttonContent}
        </Button>
      ) : (
        <Button variant="ghost" className={baseClass} asChild>
          <Link href={item.href}>{buttonContent}</Link>
        </Button>
      )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
            {item.comingSoon && (
              <span className="ml-1.5 opacity-60 text-[10px]">(em breve)</span>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-250 ease-out",
        collapsed ? "w-[68px]" : "w-[256px]"
      )}
    >
      {/* Header */}
      <div className="relative flex items-center h-16 px-4 border-b border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-2.5 overflow-hidden transition-all duration-200",
            collapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
          )}
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">
              Banco CV
            </span>
            <span className="text-[10px] text-muted-foreground">by taticca</span>
          </div>
        </div>

        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 h-7 w-7 text-muted-foreground hover:text-foreground transition-colors",
            collapsed && "right-1/2 translate-x-1/2"
          )}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="flex flex-col gap-5">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="flex flex-col gap-0.5">
              {section.title && !collapsed && (
                <span className="text-[10px] font-semibold text-muted-foreground/60 px-3 mb-1 tracking-widest uppercase">
                  {section.title}
                </span>
              )}
              {collapsed && section.title && sectionIndex > 0 && (
                <div className="h-px bg-sidebar-border/50 mx-2 mb-1 mt-0.5" />
              )}
              {section.items.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-sidebar-border">
        <div className="py-2 px-2 flex flex-col gap-0.5">
          {footerItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="group w-10 h-10 mx-auto justify-center px-0 rounded-md text-sidebar-foreground/65 hover:text-destructive hover:bg-destructive/8 transition-all duration-150"
                  onClick={onLogout}
                  aria-label="Sair"
                >
                  <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:scale-[1.08]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="group w-full justify-start gap-3 h-10 px-3 rounded-md text-sidebar-foreground/65 hover:text-destructive hover:bg-destructive/8 transition-all duration-150"
              onClick={onLogout}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:scale-[1.08]" />
              <span className="text-sm font-medium">Sair</span>
            </Button>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* User Profile */}
        <div
          className={cn(
            "p-3 flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "flex flex-col overflow-hidden transition-all duration-200",
              collapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
            )}
          >
            <span className="text-[13px] font-medium text-sidebar-foreground truncate leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] text-muted-foreground truncate leading-tight">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
