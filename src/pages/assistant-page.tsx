import { useState } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar, folderTree } from "@/components/chat/full-chat-app"
import type { FileItem } from "@/components/chat/full-chat-app"
import { WorkspaceModes } from "@/components/modes/workspace-modes"
import { SettingsSheet } from "@/components/chat/settings-sheet"
import type { SettingsValues } from "@/components/chat/settings-sheet"

export function AssistantPage() {
  // Folder expansion state — open the first folder by default
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([folderTree[0]?.id ?? ""])
  )

  // Active file state
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<SettingsValues>({
    model: "gpt-4o",
    systemPrompt: "",
    temperature: 0.7,
  })

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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
    onOpenSettings: () => setSettingsOpen(true),
  }

  return (
    <SidebarProvider>
      {/* Left sidebar */}
      <ChatSidebar side="left" {...sharedSidebarProps} />

      {/* Main content with embedded top bar */}
      <SidebarInset>
        <WorkspaceModes activeFile={activeFile} />
      </SidebarInset>

      {/* Right sidebar */}
      <ChatSidebar side="right" {...sharedSidebarProps} />

      {/* Settings sheet (portal) */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        values={settings}
        onValuesChange={setSettings}
      />
    </SidebarProvider>
  )
}
