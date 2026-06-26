"use client"

import {
  ArrowUp,
  ChevronRight,
  Copy,
  File,
  Folder,
  FolderOpen,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  X,
} from "lucide-react"
import { useRef, useState } from "react"
import { NavLink } from "react-router-dom"

import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "@/components/core/morphing-dialog"
import { TextEffect } from "@/components/core/text-effect"
import { TextShimmerWave } from "@/components/core/text-shimmer-wave"
import { ScrollArea } from "@/components/website/scroll-area"
import { Button } from "@/components/ui/button"
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container"
import {
  Message,
  MessageAction,
  MessageActions,
} from "@/components/ui/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { ScrollButton } from "@/components/ui/scroll-button"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

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

type Lawyer = {
  name: string
  firm: string
  practice: string
  jurisdiction: string
  rating: string
  bio: string
  details: string[]
  image: string
}

type TimelineStep = {
  title: string
  description: string
  state: "done" | "active" | "upcoming"
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

const TIMELINE: TimelineStep[] = [
  {
    title: "Initial Consultation",
    description: "Gathered basic facts.",
    state: "done",
  },
  {
    title: "Document Drafting",
    description: "Structuring the contestment letter based on state code.",
    state: "active",
  },
  {
    title: "Review & Revisions",
    description: "Finalize language before sending.",
    state: "upcoming",
  },
  {
    title: "Execution",
    description: "Sign and dispatch via certified mail.",
    state: "upcoming",
  },
]

const LAWYERS: Lawyer[] = [
  {
    name: "Nora Patel",
    firm: "Patel Legal",
    practice: "Commercial disputes",
    jurisdiction: "London, UK",
    rating: "4.9",
    bio: "Counsel for contract breakdown, urgent injunctions, and negotiation pressure points.",
    details: [
      "Fast commercial dispute triage.",
      "Interim relief and escalation planning.",
      "High-volume contract breach work.",
    ],
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="300" cy="275" r="120" fill="#e2e8f0"/><rect x="165" y="410" width="270" height="210" rx="105" fill="#cbd5e1"/><text x="300" y="725" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" fill="#ffffff">NP</text></svg>`
      ),
  },
  {
    name: "Daniel Okafor",
    firm: "Okafor & Co",
    practice: "Employment law",
    jurisdiction: "New York, US",
    rating: "4.8",
    bio: "Counsel for wrongful termination, workplace policy review, and internal investigations.",
    details: [
      "Pre-litigation employer pressure response.",
      "Investigation strategy and narrative framing.",
      "Employment document review.",
    ],
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="300" cy="275" r="120" fill="#d1d5db"/><rect x="165" y="410" width="270" height="210" rx="105" fill="#9ca3af"/><text x="300" y="725" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" fill="#ffffff">DO</text></svg>`
      ),
  },
  {
    name: "Elena Torres",
    firm: "Torres Counsel",
    practice: "Family and civil matters",
    jurisdiction: "California, US",
    rating: "5.0",
    bio: "Counsel for family disputes, protective orders, and settlement-first civil handling.",
    details: [
      "Protective-order strategy.",
      "Sensitive negotiation handling.",
      "Civil and family procedural guidance.",
    ],
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#475569"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="300" cy="275" r="120" fill="#e5e7eb"/><rect x="165" y="410" width="270" height="210" rx="105" fill="#cbd5e1"/><text x="300" y="725" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" fill="#ffffff">ET</text></svg>`
      ),
  },
]

const LAWYER_QUERY_RE =
  /\b(lawyer|lawyers|attorney|attorneys|counsel|solicitor|advocate|representation|represent me|hire counsel|need counsel)\b/i

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
      "Ready. Upload a filing, contract, or research note and I will break down risk, obligations, and next legal action.",
  },
]

function SidebarHoverCloseButton({ side }: { side: "left" | "right" }) {
  const { toggleSidebar, toggleSidebarRight } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="absolute right-3 top-3 opacity-0 transition-opacity group-hover/sidebar-head:opacity-100"
      onClick={() => {
        if (side === "right") {
          toggleSidebarRight()
        } else {
          toggleSidebar()
        }
      }}
    >
      <X className="size-4" />
      <span className="sr-only">Close sidebar</span>
    </Button>
  )
}

function WorkflowTimeline() {
  return (
    <div className="relative px-5 py-6">
      <div className="absolute bottom-10 left-[12px] top-7 w-px bg-[#2b2117]" />
      <div className="space-y-6">
        {TIMELINE.map((step) => (
          <div key={step.title} className="relative pl-5">
            <div
              className={cn(
                "absolute left-0 top-1 size-3 rounded-full border",
                step.state === "done" &&
                  "border-[#2b2117] bg-[#2b2117]",
                step.state === "active" &&
                  "border-[#4c86de] bg-white ring-2 ring-[#4c86de]/40",
                step.state === "upcoming" &&
                  "border-[#e6ddd1] bg-[#f3ede4]"
              )}
            />
            <p
              className={cn(
                "text-[13px] leading-5 text-[#20170f]",
                step.state === "done" && "line-through"
              )}
            >
              {step.title}
            </p>
            <p className="mt-2 max-w-[180px] text-xs leading-4 text-[#20170f]">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LawyerSuggestionCard({ lawyer }: { lawyer: Lawyer }) {
  return (
    <MorphingDialog
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 24,
      }}
    >
      <MorphingDialogTrigger
        style={{
          borderRadius: "4px",
        }}
        className="border border-gray-200/60 bg-white"
      >
        <div className="flex items-center space-x-3 p-3">
          <MorphingDialogImage
            src={lawyer.image}
            alt={lawyer.name}
            className="h-8 w-8 object-cover object-top"
            style={{
              borderRadius: "4px",
            }}
          />
          <div className="flex flex-col items-start justify-center space-y-0">
            <MorphingDialogTitle className="text-[10px] font-medium text-black sm:text-xs">
              {lawyer.name}
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className="text-[10px] text-gray-600 sm:text-xs">
              {lawyer.practice}
            </MorphingDialogSubtitle>
          </div>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{
            borderRadius: "12px",
          }}
          className="relative h-auto w-[500px] border border-gray-100 bg-white"
        >
          <ScrollArea className="h-[90vh]" type="scroll">
            <div className="relative p-6">
              <div className="flex justify-center py-10">
                <MorphingDialogImage
                  src={lawyer.image}
                  alt={lawyer.name}
                  className="h-auto w-[200px]"
                />
              </div>
              <div>
                <MorphingDialogTitle className="text-black">
                  {lawyer.name}
                </MorphingDialogTitle>
                <MorphingDialogSubtitle className="font-light text-gray-400">
                  {lawyer.firm}
                </MorphingDialogSubtitle>
                <div className="mt-4 text-sm text-gray-700">
                  <p>{lawyer.bio}</p>
                  {lawyer.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                  <p>
                    Jurisdiction: {lawyer.jurisdiction}. Rating: {lawyer.rating}/5.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <MorphingDialogClose className="text-zinc-500" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}

function SuggestedLawyers() {
  return (
    <section className="mx-auto mb-8 w-full max-w-3xl px-4">
      <div className="grid gap-3 md:grid-cols-3">
        {LAWYERS.map((lawyer) => (
          <LawyerSuggestionCard key={lawyer.name} lawyer={lawyer} />
        ))}
      </div>
    </section>
  )
}

type ChatSidebarProps = {
  side?: "left" | "right"
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  activeFileId: string | null
  onSelectFile: (file: FileItem) => void
}

export function ChatSidebar({
  side = "left",
  expandedFolders,
  onToggleFolder,
  activeFileId,
  onSelectFile,
}: ChatSidebarProps) {
  return (
    <Sidebar side={side}>
      <SidebarHeader className="group/sidebar-head relative border-b border-border/50 px-4 py-4">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {side === "right" ? "Timeline" : "JusticePath"}
        </p>
        <SidebarHoverCloseButton side={side} />
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto py-3">
        {side === "right" ? (
          <WorkflowTimeline />
        ) : (
          folderTree.map((folder) => {
            const isOpen = expandedFolders.has(folder.id)
            return (
              <div key={folder.id} className="mb-0.5">
                <button
                  onClick={() => onToggleFolder(folder.id)}
                  className="mx-2 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
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

                {isOpen && (
                  <SidebarMenu className="mt-0.5 ml-4 gap-0">
                    {folder.files.map((file) => (
                      <SidebarMenuItem key={file.id}>
                        <SidebarMenuButton
                          isActive={activeFileId === file.id}
                          onClick={() => onSelectFile(file)}
                          className="h-7 pl-5 text-xs"
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
          })
        )}
      </SidebarContent>

      {side === "left" ? (
        <SidebarFooter className="border-t border-border/50 px-2 py-2">
          <NavLink to="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-start rounded-xl px-3 text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="size-4" />
              <span className="text-xs">Settings</span>
            </Button>
          </NavLink>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  )
}

type ChatContentProps = {
  activeFile: FileItem | null
}

export function ChatContent({ activeFile }: ChatContentProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLawyers, setShowLawyers] = useState(false)
  const [chatMessages, setChatMessages] = useState(initialMessages)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    if (!prompt.trim()) return

    const submittedPrompt = prompt.trim()
    const shouldSuggestLawyers = LAWYER_QUERY_RE.test(submittedPrompt)

    const userMsg = {
      id: chatMessages.length + 1,
      role: "user" as const,
      content: submittedPrompt,
    }

    setChatMessages((prev) => [...prev, userMsg])
    setPrompt("")
    setIsLoading(true)

    setTimeout(() => {
      const context = activeFile ? `Based on ${activeFile.name}: ` : ""
      const assistantMsg = {
        id: chatMessages.length + 2,
        role: "assistant" as const,
        content: `${context}${
          submittedPrompt.endsWith("?")
            ? "Here is a structured legal analysis from the available facts and cited context."
            : "Understood. Here is the risk summary, key obligations, and practical next move."
        }`,
      }
      setChatMessages((prev) => [...prev, assistantMsg])
      setShowLawyers(shouldSuggestLawyers)
      setIsLoading(false)
    }, 1200)
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-5 py-6 md:py-8">
            {showLawyers ? <SuggestedLawyers /> : null}
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
                    <div className="group flex w-full flex-col gap-0">
                      <div className="flex-1 rounded-lg bg-transparent p-0 text-foreground">
                        <TextEffect per="char" preset="fade">
                          {message.content}
                        </TextEffect>
                      </div>
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
                    <div className="group flex max-w-[80%] flex-col items-end gap-1">
                      <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
                        {message.content}
                      </div>
                      <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
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

            {isLoading ? (
              <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-1 px-4">
                <div className="px-1 py-2">
                  <TextShimmerWave className="font-mono text-sm" duration={1}>
                    Generating legal analysis...
                  </TextShimmerWave>
                </div>
              </Message>
            ) : null}
          </ChatContainerContent>

          <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-border/60 bg-background px-4 pb-4 pt-3">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="relative z-10 w-full rounded-[28px] border border-input/80 bg-popover/96 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur"
          >
            <PromptInputTextarea
              placeholder={
                activeFile
                  ? `Ask about ${activeFile.name}...`
                  : "Ask about risk, clauses, filings, or strategy..."
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
                  className="size-8 rounded-full shadow-sm"
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

export function FullChatApp() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["cases"])
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

  const sidebarProps = {
    expandedFolders,
    onToggleFolder: toggleFolder,
    activeFileId,
    onSelectFile: selectFile,
  }

  return (
    <SidebarProvider>
      <ChatSidebar side="left" {...sidebarProps} />
      <SidebarInset>
        <ChatContent activeFile={activeFile} />
      </SidebarInset>
      <ChatSidebar side="right" {...sidebarProps} />
    </SidebarProvider>
  )
}
