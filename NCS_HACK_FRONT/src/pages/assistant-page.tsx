import { useEffect, useState } from "react"
import { toast } from "@heroui/react"
import { gsap } from "gsap"
import Lenis from "lenis"
import type { Transition, Variants } from "motion/react"

import { ChatSidebar, folderTree, type ResponseContext, type RoadmapStep } from "@/components/chat/full-chat-app"
import type { FileItem } from "@/components/chat/full-chat-app"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/core/dialog"
import { WorkspaceSidebarShell } from "@/components/layout/workspace-sidebar-shell"
import { WorkspaceModes } from "@/components/modes/workspace-modes"
import { createDocumentFromFile, getDocumentOutline } from "@/lib/document"
import type { ResponseProgress } from "@/components/chat/full-chat-app"

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
  const [isThinking, setIsThinking] = useState(false)
  const [creationMode, setCreationMode] = useState<"folder" | "file" | null>(null)
  const [creationValue, setCreationValue] = useState("")
  const [creationFolderId, setCreationFolderId] = useState<string | null>(null)
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null)
  const [renamingFileValue, setRenamingFileValue] = useState("")
  const [deletionTarget, setDeletionTarget] = useState<{
    id: string
    label: string
    type: "file" | "folder"
  } | null>(null)
  const [responseContext, setResponseContext] = useState<ResponseContext | null>(null)
  const [responseProgress, setResponseProgress] = useState<ResponseProgress | null>(null)
  const [legalRoadmap, setLegalRoadmap] = useState<RoadmapStep[]>([])
  const [legalSpecialty, setLegalSpecialty] = useState<string>("")
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null)
  const documentOutline = getDocumentOutline(activeFile, documentValue)
  const dialogVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 40,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 40,
    },
  }
  const dialogTransition: Transition = {
    type: "spring",
    bounce: 0,
    duration: 0.25,
  }

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

  const renameFolder = (folderId: string, name: string) => {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) return

    if (!name || name === folder.name) return

    setFolders((prev) =>
      prev.map((item) => (item.id === folderId ? { ...item, name } : item))
    )
    toast(`Folder renamed: ${name}`)
  }

  const deleteFolder = (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) return

    const containsActiveFile = folder.files.some((file) => file.id === activeFileId)

    setFolders((prev) => prev.filter((item) => item.id !== folderId))
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.delete(folderId)
      return next
    })

    if (containsActiveFile) {
      setActiveFileId(null)
      setActiveFile(null)
      setDocumentValue(createDocumentFromFile(null))
    }

    toast(`Folder removed: ${folder.name}`)
  }

  const requestDeleteFolder = (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) return

    setDeletionTarget({
      id: folderId,
      label: folder.name,
      type: "folder",
    })
  }

  const createFolder = (name: string) => {
    if (!name) return

    const id = `folder-${Date.now()}`
    setFolders((prev) => [...prev, { id, name, files: [] }])
    setExpandedFolders((prev) => new Set(prev).add(id))
    toast(`Folder created: ${name}`)
  }

  const addFileToFolder = (folderId: string, name: string) => {
    if (!name) return

    const ext = name.split(".").pop()?.toLowerCase() ?? "md"
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name,
      ext,
    }

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId ? { ...folder, files: [...folder.files, newFile] } : folder
      )
    )
    setExpandedFolders((prev) => new Set(prev).add(folderId))
    toast(`File added: ${name}`)
  }

  const openCreationDialog = (type: "folder" | "file", folderId?: string) => {
    setCreationMode(type)
    setCreationFolderId(folderId ?? null)
    setCreationValue(type === "folder" ? "New Folder" : "Untitled Draft.md")
  }

  const closeCreationDialog = () => {
    setCreationMode(null)
    setCreationFolderId(null)
    setCreationValue("")
  }

  const submitCreation = () => {
    const name = creationValue.trim()
    if (!name || !creationMode) return

    if (creationMode === "folder") createFolder(name)
    if (creationMode === "file" && creationFolderId) addFileToFolder(creationFolderId, name)

    closeCreationDialog()
  }

  const openRenameFileDialog = (fileId: string) => {
    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    const file = sourceFolder?.files.find((item) => item.id === fileId)
    if (!sourceFolder || !file) return

    setRenamingFileId(fileId)
    setRenamingFileValue(file.name)
  }

  const closeRenameFileDialog = () => {
    setRenamingFileId(null)
    setRenamingFileValue("")
  }

  const submitRenameFile = () => {
    const fileId = renamingFileId
    const name = renamingFileValue.trim()
    if (!fileId) return

    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    const file = sourceFolder?.files.find((item) => item.id === fileId)
    if (!sourceFolder || !file) return

    if (!name || name === file.name) return

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === sourceFolder.id
          ? {
              ...folder,
              files: folder.files.map((item) =>
                item.id === fileId ? { ...item, name } : item
              ),
            }
          : folder
      )
    )

    if (activeFileId === fileId) {
      setActiveFile((prev) => (prev ? { ...prev, name } : prev))
    }

    toast("File renamed")
    closeRenameFileDialog()
  }

  const requestDeleteFile = (fileId: string) => {
    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    const file = sourceFolder?.files.find((item) => item.id === fileId)
    if (!file) return

    setDeletionTarget({
      id: fileId,
      label: file.name,
      type: "file",
    })
  }

  const confirmDelete = () => {
    if (!deletionTarget) return

    if (deletionTarget.type === "folder") {
      deleteFolder(deletionTarget.id)
      setDeletionTarget(null)
      return
    }

    const fileId = deletionTarget.id

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
    setDeletionTarget(null)
  }

  const moveFile = (fileId: string, targetFolderId?: string, targetIndex?: number) => {
    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    if (!sourceFolder) return

    const file = sourceFolder.files.find((item) => item.id === fileId)
    if (!file) return

    const target =
      targetFolderId ??
      folders.find((folder) => folder.id !== sourceFolder.id)?.id ??
      sourceFolder.id

    setFolders((prev) =>
      prev.map((folder) => {
        const remainingFiles = folder.files.filter((item) => item.id !== fileId)

        if (folder.id !== target) {
          return { ...folder, files: remainingFiles }
        }

        const nextFiles = [...remainingFiles]
        const insertAt =
          typeof targetIndex === "number"
            ? Math.max(0, Math.min(targetIndex, nextFiles.length))
            : nextFiles.length

        nextFiles.splice(insertAt, 0, file)
        return { ...folder, files: nextFiles }
      })
    )

    toast(`Moved: ${file.name}`)
  }

  const sharedSidebarProps = {
    folders,
    expandedFolders,
    onToggleFolder: toggleFolder,
    activeFileId,
    onSelectFile: selectFile,
    onCreateFolder: () => openCreationDialog("folder"),
    onAddFile: (folderId: string) => openCreationDialog("file", folderId),
    onRenameFolder: renameFolder,
    onDeleteFolder: requestDeleteFolder,
    onRenameFile: openRenameFileDialog,
    onOpenEditor: () => {
      setMode("editor")
      toast("Editor opened")
    },
    onDeleteFile: requestDeleteFile,
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
    <>
      <Dialog
        open={creationMode !== null}
        onOpenChange={(open) => !open && closeCreationDialog()}
        variants={dialogVariants}
        transition={dialogTransition}
      >
        <DialogContent className="w-full max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              {creationMode === "folder" ? "Create folder" : "Create file"}
            </DialogTitle>
            <DialogDescription className="text-zinc-600">
              {creationMode === "folder" ? "Enter folder name." : "Enter file name."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col space-y-4">
            <label htmlFor="creation-name" className="sr-only">
              Name
            </label>
            <input
              id="creation-name"
              value={creationValue}
              onChange={(event) => setCreationValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submitCreation()
                }
              }}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 sm:text-sm"
              placeholder="Enter name"
              autoFocus
            />
            <button
              className="inline-flex items-center justify-center self-end rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50"
              type="button"
              onClick={submitCreation}
            >
              Create
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      <Dialog
        open={renamingFileId !== null}
        onOpenChange={(open) => !open && closeRenameFileDialog()}
        variants={dialogVariants}
        transition={dialogTransition}
      >
        <DialogContent className="w-full max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Rename file</DialogTitle>
            <DialogDescription className="text-zinc-600">
              Update the file name shown in the workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col space-y-4">
            <label htmlFor="rename-file-name" className="sr-only">
              Name
            </label>
            <input
              id="rename-file-name"
              value={renamingFileValue}
              onChange={(event) => setRenamingFileValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submitRenameFile()
                }
              }}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 sm:text-sm"
              placeholder="Enter file name"
              autoFocus
            />
            <button
              className="inline-flex items-center justify-center self-end rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50"
              type="button"
              onClick={submitRenameFile}
            >
              Rename
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletionTarget !== null}
        onOpenChange={(open) => !open && setDeletionTarget(null)}
        variants={dialogVariants}
        transition={dialogTransition}
      >
        <DialogContent className="w-full max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              Delete {deletionTarget?.type === "folder" ? "folder" : "file"}?
            </DialogTitle>
            <DialogDescription className="text-zinc-600">
              {deletionTarget?.label ?? "This item"} will be removed from the workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
              type="button"
              onClick={() => setDeletionTarget(null)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50"
              type="button"
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      <WorkspaceSidebarShell
        leftSidebar={
          <ChatSidebar
            side="left"
            mode={mode}
            activeFile={activeFile}
            documentOutline={documentOutline}
            {...sharedSidebarProps}
          />
        }
        rightSidebar={
          <ChatSidebar
            side="right"
            mode={mode}
            activeFile={activeFile}
            documentOutline={documentOutline}
            hasConversation={hasConversation}
            isThinking={mode === "consultant" && isThinking}
            responseContext={responseContext}
            responseProgress={responseProgress}
            activeCitationId={activeCitationId}
            onCitationSelect={setActiveCitationId}
            legalRoadmap={legalRoadmap}
            legalSpecialty={legalSpecialty}
            {...sharedSidebarProps}
          />
        }
      >
        <WorkspaceModes
          mode={mode}
          onModeChange={setMode}
          activeFile={activeFile}
          documentValue={documentValue}
          onDocumentChange={setDocumentValue}
          onConversationStateChange={setHasConversation}
          onThinkingStateChange={setIsThinking}
          onResponseContextChange={setResponseContext}
          onResponseProgressChange={setResponseProgress}
          activeCitationId={activeCitationId}
          onActiveCitationChange={setActiveCitationId}
          onRoadmapChange={(roadmap, specialty) => { setLegalRoadmap(roadmap); setLegalSpecialty(specialty) }}
        />
      </WorkspaceSidebarShell>
    </>
  )
}
