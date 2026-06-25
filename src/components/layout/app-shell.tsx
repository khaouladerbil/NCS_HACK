import { type CSSProperties, type ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { primaryNav, sideNotes } from "@/data/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

type AppShellProps = {
  title: string
  children: ReactNode
}

export function AppShell({ title, children }: AppShellProps) {
  const location = useLocation()
  const notes = sideNotes[location.pathname] ?? []

  return (
    <SidebarProvider
      defaultOpen
      className="min-h-dvh [&_[data-slot=sidebar-gap]]:hidden"
      style={
        {
          "--sidebar-width": "4rem",
          "--sidebar-width-icon": "4rem",
          "--sidebar-width-mobile": "18rem",
        } as CSSProperties
      }
    >
      <Sidebar
        collapsible="icon"
        variant="floating"
        className="z-30 border-0"
      >
        <SidebarHeader className="p-2">
          <div className="flex h-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            J
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarGroup className="p-0">
            <SidebarMenu className="gap-1">
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={<NavLink to={item.to} />}
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                    className="h-10 rounded-xl"
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <div className="relative min-h-dvh w-full">
        <aside className="pointer-events-none absolute top-3 left-20 z-20 hidden w-64 md:block">
          <div className="pointer-events-auto rounded-2xl border border-border/80 bg-card/88 p-4 shadow-sm backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              JusticePath
            </div>
            <h1 className="mt-3 text-xl font-medium tracking-tight">{title}</h1>
            <SidebarSeparator className="mx-0 my-4 w-full" />
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note}
                  className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main
          className={cn(
            "min-h-dvh w-full bg-card/88 backdrop-blur"
          )}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
