import { useEffect, useState } from "react"
import { toast } from "@heroui/react"
import { gsap } from "gsap"
import Lenis from "lenis"

import { ChatSidebar, folderTree } from "@/components/chat/full-chat-app"
import type { FileItem } from "@/components/chat/full-chat-app"
import { WorkspaceModes } from "@/components/modes/workspace-modes"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createDocumentFromFile } from "@/lib/document"

export type WorkspaceMode = "consultant" | "editor" | "professor"

export function AssistantPage() {
  const [mode, setMode] = useState<WorkspaceMode>("consultant")
  const [folders, setFolders] = useState(folderTree)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([folderTree[0]?.id ?? ""])
  )
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [documentValue, setDocumentValue] = useState(createDocumentFromFile(null))
  const [hasConversation, setHasConversation] = useState(false)

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
    setDocumentValue(createDocumentFromFile(file))
  }

  const createDocument = () => {
    const newFile: FileItem = {
      id: `custom-${Date.now()}`,
      name: `New Document ${folders[0]?.files.length ? folders[0].files.length + 1 : 1}.md`,
      ext: "md",
    }

    setFolders((prev) =>
      prev.map((folder, index) =>
        index === 0 ? { ...folder, files: [newFile, ...folder.files] } : folder
      )
    )
    setExpandedFolders((prev) => new Set(prev).add(folderTree[0]?.id ?? "cases"))
    selectFile(newFile)
    setMode("editor")
    toast("Document created")
  }

  const createFolder = () => {
    const name = window.prompt("Folder name", "New Folder")?.trim()
    if (!name) return
    const id = `folder-${Date.now()}`

    setFolders((prev) => [
      ...prev,
      {
        id,
        name,
        files: [],
      },
    ])
    setExpandedFolders((prev) => new Set(prev).add(id))
    toast(`Folder created: ${name}`)
  }

  const renameFolder = (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) return

    const name = window.prompt("Rename folder", folder.name)?.trim()
    if (!name || name === folder.name) return

    setFolders((prev) =>
      prev.map((item) => (item.id === folderId ? { ...item, name } : item))
    )
    toast(`Folder renamed: ${name}`)
  }

  const deleteFile = (fileId: string) => {
    setFolders((prev) =>
      prev
        .map((folder) => ({
          ...folder,
          files: folder.files.filter((file) => file.id !== fileId),
        }))
        .filter((folder) => folder.files.length > 0)
    )

    if (activeFileId === fileId) {
      setActiveFileId(null)
      setActiveFile(null)
      setDocumentValue(createDocumentFromFile(null))
    }

    toast("File removed")
  }

  const moveFile = (fileId: string, targetFolderId?: string) => {
    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    if (!sourceFolder) return

    const file = sourceFolder.files.find((item) => item.id === fileId)
    if (!file) return

    const target =
      targetFolderId ??
      folders.find((folder) => folder.id !== sourceFolder.id)?.id ??
      sourceFolder.id

    if (target === sourceFolder.id) return

    setFolders((prev) => {
      const next = prev.map((folder) => ({
        ...folder,
        files: folder.files.filter((item) => item.id !== fileId),
      }))

      return next.map((folder) =>
        folder.id === target ? { ...folder, files: [...folder.files, file] } : folder
      )
    })

    toast(`Moved: ${file.name}`)
  }

  const sharedSidebarProps = {
    folders,
    expandedFolders,
    onToggleFolder: toggleFolder,
    activeFileId,
    onSelectFile: selectFile,
    onCreateDocument: createDocument,
    onCreateFolder: createFolder,
    onRenameFolder: renameFolder,
    onOpenEditor: () => {
      setMode("editor")
      toast("Editor opened")
    },
    onDeleteFile: deleteFile,
    onMoveFile: moveFile,
  }

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.9,
      smoothWheel: true,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = window.requestAnimationFrame(raf)
    }

    rafId = window.requestAnimationFrame(raf)

    const clickableSelector = "button, a, [role='button']"
    const handlePointerDown = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(clickableSelector)
      if (!target) return

      gsap.fromTo(
        target,
        { scale: 1 },
        {
          scale: 0.96,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          overwrite: true,
        }
      )
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      window.cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <SidebarProvider>
      <div className="fixed left-3 top-3 z-40">
        <div className="flex items-center">
          <SidebarTrigger
            side="left"
            className="rounded-full bg-white/95 text-[#6b533e] shadow-[0_8px_20px_rgba(80,58,38,0.08)]"
          />
        </div>
      </div>
      <div className="fixed right-3 top-3 z-40">
        <SidebarTrigger
          side="right"
          className="rounded-full bg-white/95 text-[#6b533e] shadow-[0_8px_20px_rgba(80,58,38,0.08)]"
        />
      </div>
      <ChatSidebar side="left" {...sharedSidebarProps} />
      <SidebarInset>
        <WorkspaceModes
          mode={mode}
          onModeChange={setMode}
          activeFile={activeFile}
          documentValue={documentValue}
          onDocumentChange={setDocumentValue}
          onConversationStateChange={setHasConversation}
        />
      </SidebarInset>
      <ChatSidebar
        side="right"
        hasConversation={hasConversation}
        isThinking={mode === "consultant" && hasConversation}
        {...sharedSidebarProps}
      />
    </SidebarProvider>
  )
}
