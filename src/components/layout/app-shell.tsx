import { type CSSProperties, type ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { primaryNav } from "@/data/navigation"
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
  SidebarTrigger,
} from "@/components/ui/sidebar"

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()

  return (
    <SidebarProvider
      defaultOpen
      className="min-h-dvh [&_[data-slot=sidebar-gap]]:hidden"
      style={
        {
          "--sidebar-width": "14rem",
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
        <div className="pointer-events-none fixed top-3 left-3 z-40">
          <SidebarTrigger className="pointer-events-auto rounded-xl border border-border/80 bg-card/92 shadow-sm backdrop-blur" />
        </div>

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
