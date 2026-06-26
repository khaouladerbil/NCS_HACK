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
  rightSidebar: ReactNode
}

export function WorkspaceSidebarShell({
  children,
  leftSidebar,
  rightSidebar,
}: WorkspaceSidebarShellProps) {
  return (
    <SidebarProvider defaultOpen defaultOpenRight={false} className="relative">
      <SidebarEdgeTriggers />
      {leftSidebar}
      <div className="absolute inset-0 min-w-0">
        <SidebarInset className="min-h-dvh">{children}</SidebarInset>
      </div>
      {rightSidebar}
    </SidebarProvider>
  )
}

function SidebarEdgeTriggers() {
  const { open, openRight } = useSidebar()

  return (
    <>
      <div
        className="fixed top-[4.85rem] z-[60] transition-[left] duration-200 ease-linear"
        style={{
          left: open ? "calc(18.75rem - 0.9rem)" : "0px",
        }}
      >
        <SidebarTrigger
          side="left"
          className="rounded-full bg-white text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
        />
      </div>
      <div
        className="fixed top-[4.85rem] z-[60] transition-[right] duration-200 ease-linear"
        style={{
          right: openRight ? "calc(18.75rem - 0.9rem)" : "0px",
        }}
      >
        <SidebarTrigger
          side="right"
          className="rounded-full bg-white text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
        />
      </div>
    </>
  )
}
