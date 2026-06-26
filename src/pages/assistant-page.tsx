import { useState } from "react"

import { ChatSidebar, folderTree } from "@/components/chat/full-chat-app"
import type { FileItem } from "@/components/chat/full-chat-app"
import { WorkspaceModes } from "@/components/modes/workspace-modes"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function AssistantPage() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([folderTree[0]?.id ?? ""])
  )
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectFile = (file: FileItem) => {
    setActiveFileId(file.id)
    setActiveFile(file)
  }

  const sharedSidebarProps = {
    expandedFolders,
    onToggleFolder: toggleFolder,
    activeFileId,
    onSelectFile: selectFile,
  }

  return (
    <SidebarProvider>
      <ChatSidebar side="left" {...sharedSidebarProps} />
      <SidebarInset>
        <WorkspaceModes activeFile={activeFile} />
      </SidebarInset>
      <ChatSidebar side="right" {...sharedSidebarProps} />
    </SidebarProvider>
  )
}
