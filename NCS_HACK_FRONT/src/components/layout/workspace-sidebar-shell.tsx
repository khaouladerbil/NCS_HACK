import type { ReactNode } from "react"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

type WorkspaceSidebarShellProps = {
  children: ReactNode
  leftSidebar: ReactNode
}

export function WorkspaceSidebarShell({
  children,
  leftSidebar,
}: WorkspaceSidebarShellProps) {
  return (
    <SidebarProvider defaultOpen className="relative">
      <LeftReopenTrigger />
      {leftSidebar}
      <div className="absolute inset-0 min-w-0">
        <SidebarInset className="min-h-dvh">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function LeftReopenTrigger() {
  const { open } = useSidebar()
  if (open) return null
  return (
    <div className="fixed left-3 top-4 z-[60]">
      <SidebarTrigger
        side="left"
        className="size-9 rounded-full bg-white text-[#374151] shadow-[0_8px_20px_rgba(15,23,42,0.1)] hover:bg-[#f8f5f0]"
      />
    </div>
  )
}
