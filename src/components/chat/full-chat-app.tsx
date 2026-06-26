"use client"

import {
  ChevronRight,
  Copy,
  File,
  Folder,
  FolderOpen,
  Mic,
  Pencil,
  Scale,
  Settings2,
  SendHorizontal,
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
import { Markdown } from "@/components/ui/markdown"
import {
  PromptInput,
  PromptInputAction,
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

type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
  suggestLawyers?: boolean
}

type Lawyer = {
  name: string
  firm: string
  practice: string
  jurisdiction: string
  image: string
  body: string[]
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
    body: [
      "Commercial disputes and urgent injunction work.",
      "Pre-action pressure, settlement framing, and contract breach escalation.",
      "Jurisdiction: London, UK.",
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
    body: [
      "Wrongful termination, policy review, and workplace investigations.",
      "Useful where employer records, notices, or internal findings matter.",
      "Jurisdiction: New York, US.",
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
    body: [
      "Family disputes, protective orders, and settlement-first civil handling.",
      "Useful where sensitive personal facts and court pacing both matter.",
      "Jurisdiction: California, US.",
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

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    content:
      "Can you review the termination clause in the Rental Agreement.pdf I just uploaded? Specifically looking for notice periods.",
  },
  {
    id: 2,
    role: "assistant",
    content: `I have reviewed the termination clause (Section 8) in the **Rental Agreement.pdf**.

> "8.1 Either party may terminate this agreement by providing written notice no less than thirty (30) days prior to the intended date of termination..."

## Key Takeaways

You must provide at least 30 days written notice.

The notice must be in writing (email is usually acceptable unless specified otherwise in Section 12).

This applies to both you (tenant) and the landlord.`,
  },
]

function TextEffectPerChar({ children }: { children: string }) {
  return <TextEffect per="char" preset="fade">{children}</TextEffect>
}

function splitLeadParagraph(content: string) {
  const [lead, ...rest] = content.split("\n\n")
  return {
    lead: lead ?? content,
    rest: rest.join("\n\n").trim(),
  }
}

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
                step.state === "done" && "border-[#2b2117] bg-[#2b2117]",
                step.state === "active" &&
                  "border-[#4c86de] bg-white ring-2 ring-[#4c86de]/40",
                step.state === "upcoming" && "border-[#e6ddd1] bg-[#f3ede4]"
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

function MorphingDialogBasicTwo({ lawyer }: { lawyer: Lawyer }) {
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
              <div className="">
                <MorphingDialogTitle className="text-black">
                  {lawyer.name}
                </MorphingDialogTitle>
                <MorphingDialogSubtitle className="font-light text-gray-400">
                  {lawyer.firm}
                </MorphingDialogSubtitle>
                <div className="mt-4 text-sm text-gray-700">
                  {lawyer.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
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

function InlineLawyerSuggestions() {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {LAWYERS.map((lawyer) => (
        <MorphingDialogBasicTwo key={lawyer.name} lawyer={lawyer} />
      ))}
    </div>
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

                {isOpen ? (
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
                ) : null}
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    if (!prompt.trim()) return

    const submittedPrompt = prompt.trim()
    const shouldSuggestLawyers = LAWYER_QUERY_RE.test(submittedPrompt)

    const userMsg: ChatMessage = {
      id: chatMessages.length + 1,
      role: "user",
      content: submittedPrompt,
    }

    setChatMessages((prev) => [...prev, userMsg])
    setPrompt("")
    setIsLoading(true)

    setTimeout(() => {
      const context = activeFile ? `Based on ${activeFile.name}: ` : ""
      const assistantMsg: ChatMessage = {
        id: chatMessages.length + 2,
        role: "assistant",
        content: `${context}${
          submittedPrompt.endsWith("?")
            ? "I reviewed the relevant clause and prepared a focused legal summary."
            : "I prepared the legal summary, immediate risk points, and the next recommended action."
        }

> "Confirm the operative clause language, the required notice method, and the effective date before sending."

## Key Takeaways

State the controlling provision clearly.

List the notice deadline and delivery method.

Prepare the next draft or filing based on the selected record.`,
        suggestLawyers: shouldSuggestLawyers,
      }
      setChatMessages((prev) => [...prev, assistantMsg])
      setIsLoading(false)
    }, 1200)
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fcf7ee]">
      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-5 py-8 md:py-10">
            <div className="mx-auto mb-12 max-w-4xl px-4 pt-6 text-center">
              <h1 className="text-[clamp(2rem,3vw,3.2rem)] font-normal tracking-[-0.04em] text-[#7a6755]">
                How can I assist with your legal document today?
              </h1>
            </div>

            {chatMessages.map((message, index) => {
              const isAssistant = message.role === "assistant"
              const isLastMessage = index === chatMessages.length - 1
              const assistantCopy = isAssistant
                ? splitLeadParagraph(message.content)
                : null

              return (
                <Message
                  key={message.id}
                  className={cn(
                    "mx-auto mb-8 flex w-full max-w-6xl flex-col gap-1 px-4",
                    isAssistant ? "items-start" : "items-end"
                  )}
                >
                  {isAssistant ? (
                    <div className="group flex w-full items-start gap-5">
                      <div className="mt-1 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[18px] border border-[#ead5aa] bg-[#f8edd6] text-[#36271a] shadow-[0_1px_4px_rgba(90,62,38,0.06)]">
                        <Scale className="size-7" />
                      </div>

                      <div className="w-full max-w-[68rem] rounded-[2rem] border border-[#e6dbc9] bg-[#f5efe4] px-8 py-8 text-[#5b4838] shadow-[0_2px_8px_rgba(95,71,47,0.06)]">
                        <div className="mb-6 text-[1.12rem] leading-8">
                          <TextEffectPerChar>
                            {assistantCopy?.lead ?? message.content}
                          </TextEffectPerChar>
                        </div>
                        {assistantCopy?.rest ? (
                          <Markdown
                            className="text-[1.02rem] leading-8 [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:text-[1.15rem] [&_h2]:font-semibold [&_h2]:text-[#4d392b] [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-[#463528] [&_blockquote]:my-6 [&_blockquote]:rounded-[18px] [&_blockquote]:border [&_blockquote]:border-[#ecd9b9] [&_blockquote]:bg-white [&_blockquote]:px-8 [&_blockquote]:py-7 [&_blockquote]:text-[#75604b] [&_blockquote]:shadow-[inset_4px_0_0_#e8c58b]"
                          >
                            {assistantCopy.rest}
                          </Markdown>
                        ) : null}

                        {message.suggestLawyers ? <InlineLawyerSuggestions /> : null}

                        <div className="mt-8 flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            className="h-12 rounded-full border-[#e3d7c3] bg-white px-7 text-[1.05rem] font-semibold text-[#6b533e] shadow-none hover:bg-white"
                          >
                            Draft Notice
                          </Button>
                          <Button
                            variant="outline"
                            className="h-12 rounded-full border-[#e3d7c3] bg-white px-7 text-[1.05rem] font-semibold text-[#6b533e] shadow-none hover:bg-white"
                          >
                            Check Section 12
                          </Button>
                        </div>
                      </div>

                      <MessageActions
                        className={cn(
                          "-ml-2 mt-2 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
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
                    <div className="group flex w-full max-w-[58rem] flex-col items-end gap-1">
                      <div className="rounded-[2rem] border border-[#e8dfd3] bg-white px-7 py-6 text-[1.2rem] leading-[1.55] text-[#624f3d] shadow-[0_2px_10px_rgba(92,70,46,0.06)]">
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
                <div className="px-1 py-2 text-[#6d5a48]">
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

      <div className="sticky bottom-0 z-20 shrink-0 bg-transparent px-6 pb-6 pt-4">
        <div className="mx-auto max-w-6xl">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="relative z-10 w-full rounded-[2rem] border border-[#eadfcd] bg-white p-0 shadow-[0_18px_50px_rgba(204,173,125,0.34)]"
          >
            <PromptInputTextarea
              placeholder="Type your response or instructions here..."
              className="min-h-[116px] px-8 pt-7 pb-4 text-[1.12rem] leading-snug text-[#5d4937] placeholder:text-[#b39d88]"
            />
            <div className="flex items-center justify-end gap-3 px-6 pb-5 pt-0">
              <PromptInputAction tooltip="Voice input">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-full text-[#70553d] hover:bg-transparent hover:text-[#5c422b]"
                >
                  <Mic className="size-6" />
                </Button>
              </PromptInputAction>
              <Button
                size="icon"
                disabled={!prompt.trim() || isLoading}
                onClick={handleSubmit}
                className="size-14 rounded-[1.15rem] bg-[#6a4f34] text-white shadow-none hover:bg-[#5c442e]"
              >
                {isLoading ? (
                  <span className="size-4 rounded-sm bg-white" />
                ) : (
                  <SendHorizontal className="size-6" />
                )}
              </Button>
            </div>
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
