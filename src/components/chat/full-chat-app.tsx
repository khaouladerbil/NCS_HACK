"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { ScrollButton } from "@/components/ui/scroll-button"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  ChevronRight,
  Copy,
  File,
  Folder,
  FolderOpen,
  Globe,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react"
import { useRef, useState } from "react"
import {
  SettingsSheet,
  SettingsTrigger,
  type SettingsValues,
} from "@/components/chat/settings-sheet"

// ─── Folder / File Tree Data ────────────────────────────────────────────────

export type FileItem = {
  id: string
  name: string
  ext?: string
}

export type FolderItem = {
  id: string
  name: string
  files: FileItem[]
}

export const folderTree: FolderItem[] = [
  {
    id: "cases",
    name: "Active Cases",
    files: [
      { id: "cases-1", name: "Smith v Jones.pdf", ext: "pdf" },
      { id: "cases-2", name: "Plaintiff Brief.docx", ext: "docx" },
      { id: "cases-3", name: "Evidence Log.xlsx", ext: "xlsx" },
    ],
  },
  {
    id: "research",
    name: "Legal Research",
    files: [
      { id: "research-1", name: "Precedent Cases.md", ext: "md" },
      { id: "research-2", name: "Statute Notes.txt", ext: "txt" },
    ],
  },
  {
    id: "contracts",
    name: "Contracts",
    files: [
      { id: "contracts-1", name: "NDA Template.docx", ext: "docx" },
      { id: "contracts-2", name: "Service Agreement.pdf", ext: "pdf" },
      { id: "contracts-3", name: "Employment Contract.pdf", ext: "pdf" },
    ],
  },
  {
    id: "filings",
    name: "Court Filings",
    files: [
      { id: "filings-1", name: "Motion to Dismiss.pdf", ext: "pdf" },
      { id: "filings-2", name: "Response to Discovery.docx", ext: "docx" },
    ],
  },
]

// ─── Initial chat messages ────────────────────────────────────────────────────

const initialMessages = [
  {
    id: 1,
    role: "user",
    content: "Hello! Can you help me analyse a contract?",
  },
  {
    id: 2,
    role: "assistant",
    content:
      "Of course! I'm ready to help with contract analysis. Please select a file from the sidebar or paste the contract text, and let me know what you'd like me to focus on.",
  },
]

// ─── ChatSidebar ──────────────────────────────────────────────────────────────

type ChatSidebarProps = {
  side?: "left" | "right"
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  activeFileId: string | null
  onSelectFile: (file: FileItem) => void
  onOpenSettings: () => void
}

export function ChatSidebar({
  side = "left",
  expandedFolders,
  onToggleFolder,
  activeFileId,
  onSelectFile,
  onOpenSettings,
}: ChatSidebarProps) {
  return (
    <Sidebar side={side}>
      {/* Header — logo only, no search, no new chat */}
      <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="bg-primary size-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground">
            J
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            JusticePath
          </span>
        </div>
      </SidebarHeader>

      {/* Folder / File tree */}
      <SidebarContent className="py-3 overflow-y-auto">
        {folderTree.map((folder) => {
          const isOpen = expandedFolders.has(folder.id)
          return (
            <div key={folder.id} className="mb-0.5">
              {/* Folder row */}
              <button
                onClick={() => onToggleFolder(folder.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-colors mx-2"
                style={{ width: "calc(100% - 16px)" }}
              >
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0 transition-transform duration-150",
                    isOpen && "rotate-90"
                  )}
                />
                {isOpen ? (
                  <FolderOpen className="size-3.5 shrink-0 text-amber-500" />
                ) : (
                  <Folder className="size-3.5 shrink-0 text-amber-500/80" />
                )}
                <span className="truncate">{folder.name}</span>
              </button>

              {/* Files */}
              {isOpen && (
                <SidebarMenu className="mt-0.5 ml-4 gap-0">
                  {folder.files.map((file) => (
                    <SidebarMenuItem key={file.id}>
                      <SidebarMenuButton
                        isActive={activeFileId === file.id}
                        onClick={() => onSelectFile(file)}
                        className="pl-5 text-xs h-7"
                      >
                        <File className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </div>
          )
        })}
      </SidebarContent>

      {/* Footer — settings button only */}
      <SidebarFooter className="border-t border-border/50 py-2 px-2">
        <SettingsTrigger onClick={onOpenSettings} />
      </SidebarFooter>
    </Sidebar>
  )
}

// ─── ChatContent ──────────────────────────────────────────────────────────────

type ChatContentProps = {
  activeFile: FileItem | null
}

export function ChatContent({ activeFile }: ChatContentProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState(initialMessages)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    if (!prompt.trim()) return

    const userMsg = {
      id: chatMessages.length + 1,
      role: "user",
      content: prompt.trim(),
    }

    setChatMessages((prev) => [...prev, userMsg])
    setPrompt("")
    setIsLoading(true)

    setTimeout(() => {
      const context = activeFile
        ? `Based on **${activeFile.name}**: `
        : ""
      const assistantMsg = {
        id: chatMessages.length + 2,
        role: "assistant",
        content: `${context}${prompt.trim().endsWith("?")
          ? "That's a great question. Here's my analysis based on the available context and legal precedents."
          : "Understood. I've reviewed that and here's what I found."
        }`,
      }
      setChatMessages((prev) => [...prev, assistantMsg])
      setIsLoading(false)
    }, 1200)
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      {/* Message list */}
      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-5 py-10">
            {chatMessages.map((message, index) => {
              const isAssistant = message.role === "assistant"
              const isLastMessage = index === chatMessages.length - 1

              return (
                <Message
                  key={message.id}
                  className={cn(
                    "mx-auto flex w-full max-w-3xl flex-col gap-1 px-4",
                    isAssistant ? "items-start" : "items-end"
                  )}
                >
                  {isAssistant ? (
                    /* ── Assistant bubble ── */
                    <div className="group flex w-full flex-col gap-0">
                      <MessageContent
                        className="text-foreground prose flex-1 rounded-lg bg-transparent p-0 max-w-none"
                        markdown
                      >
                        {message.content}
                      </MessageContent>
                      <MessageActions
                        className={cn(
                          "-ml-2 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                          isLastMessage && "opacity-100"
                        )}
                      >
                        <MessageAction tooltip="Copy">
                          <Button variant="ghost" size="icon" className="size-7 rounded-full">
                            <Copy className="size-3.5" />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  ) : (
                    /* ── User bubble ── */
                    <div className="group flex flex-col items-end gap-1 max-w-[80%]">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <MessageActions
                        className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      >
                        <MessageAction tooltip="Edit">
                          <Button variant="ghost" size="icon" className="size-7 rounded-full">
                            <Pencil className="size-3.5" />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Copy">
                          <Button variant="ghost" size="icon" className="size-7 rounded-full">
                            <Copy className="size-3.5" />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  )}
                </Message>
              )
            })}

            {isLoading && (
              <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-1 px-4">
                <div className="flex items-center gap-1.5 py-2">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </Message>
            )}
          </ChatContainerContent>

          <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>

      {/* Input bar */}
      <div className="bg-background z-10 shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full rounded-2xl border p-0 shadow-sm"
          >
            <PromptInputTextarea
              placeholder={
                activeFile
                  ? `Ask about ${activeFile.name}…`
                  : "Ask anything…"
              }
              className="min-h-[44px] px-4 pt-3.5 pb-2 text-sm leading-snug"
            />

            <PromptInputActions className="flex w-full items-center justify-between gap-2 px-3 pb-3 pt-0">
              <div className="flex items-center gap-1.5">
                <PromptInputAction tooltip="Attach file">
                  <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground">
                    <Plus className="size-4" />
                  </Button>
                </PromptInputAction>
                <PromptInputAction tooltip="Web search">
                  <Button variant="outline" size="sm" className="rounded-full h-8 px-3 gap-1.5 text-xs font-normal">
                    <Globe className="size-3.5" />
                    Search
                  </Button>
                </PromptInputAction>
                <PromptInputAction tooltip="More">
                  <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </PromptInputAction>
              </div>

              <div className="flex items-center gap-1.5">
                <PromptInputAction tooltip="Voice input">
                  <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground">
                    <Mic className="size-4" />
                  </Button>
                </PromptInputAction>
                <Button
                  size="icon"
                  disabled={!prompt.trim() || isLoading}
                  onClick={handleSubmit}
                  className="size-8 rounded-full"
                >
                  {isLoading ? (
                    <span className="size-3 rounded-sm bg-white" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </main>
  )
}

// ─── FullChatApp (legacy default export kept for compatibility) ────────────────

export function FullChatApp() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["cases"])
  )
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
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

  const sidebarProps = {
    expandedFolders,
    onToggleFolder: toggleFolder,
    activeFileId,
    onSelectFile: selectFile,
    onOpenSettings: () => setSettingsOpen(true),
  }

  return (
    <SidebarProvider>
      <ChatSidebar side="left" {...sidebarProps} />
      <SidebarInset>
        <ChatContent activeFile={activeFile} />
      </SidebarInset>
      <ChatSidebar side="right" {...sidebarProps} />
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        values={settings}
        onValuesChange={setSettings}
      />
    </SidebarProvider>
  )
}
