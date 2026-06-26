"use client"

import {
  ArrowRightLeft,
  BookOpen,
  Check,
  ChevronUp,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  FolderPen,
  FolderPlus,
  FolderOpen,
  Mic,
  Pencil,
  Plus,
  Quote,
  Scale,
  Sparkles,
  Settings2,
  ShieldCheck,
  Square,
  Trash2,
  SendHorizontal,
  X,
} from "lucide-react"
import { toast } from "@heroui/react"
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { gsap } from "gsap"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/core/accordion"
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
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from "@/components/ui/chain-of-thought"
import { Markdown } from "@/components/ui/markdown"
import {
  Message,
  MessageAction,
  MessageActions,
} from "@/components/ui/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ui/reasoning"
import { ScrollButton } from "@/components/ui/scroll-button"
import {
  Source,
  SourceContent,
  SourceTrigger,
} from "@/components/ui/source"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import logoMark from "../../../Logo.svg"

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
  attachments?: AttachmentItem[]
  suggestLawyers?: boolean
  revealLawyers?: boolean
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

type AttachmentItem = {
  id: string
  name: string
  type: string
  previewUrl?: string
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0: {
      transcript: string
    }
  }>
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

const WORKFLOW_SOURCES = [
  {
    href: "https://www.law.cornell.edu/wex/notice",
    title: "Notice requirement overview",
    description: "Background on formal notice obligations and delivery mechanics.",
    label: "Notice",
  },
  {
    href: "https://www.law.cornell.edu/ucc/2/2-309",
    title: "Termination and reasonable notice",
    description: "Reference for termination timing and notice concepts.",
    label: "UCC 2-309",
  },
]

const WORKFLOW_QUOTES = [
  '"Written notice must be delivered no later than thirty (30) days before the intended effective date."',
  '"Service by email is effective only when the agreement expressly permits electronic notice."',
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

const initialMessages: ChatMessage[] = []

const QUICK_PROMPTS = [
  "Review my termination clause.",
  "Draft a notice to vacate.",
  "Summarize this filing.",
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

function WorkflowTimeline({
  hasConversation,
  isThinking,
}: {
  hasConversation: boolean
  isThinking: boolean
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasConversation || !sectionRef.current) return

    gsap.fromTo(
      sectionRef.current.querySelectorAll("[data-flow-step]"),
      {
        opacity: 0,
        y: 12,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.28,
        stagger: 0.08,
        ease: "power2.out",
      }
    )
  }, [hasConversation, isThinking])

  if (!hasConversation) {
    return (
      <div className="flex min-h-full items-center px-4 py-6">
        <div className="mx-auto max-w-[12rem] text-center">
          <p className="text-[0.64rem] font-semibold tracking-[0.18em] text-[#a7927c] uppercase">
            Matter Board
          </p>
          <p className="mt-3 text-[0.74rem] leading-5 text-[#8a7764]">
            Empty until a prompt starts the matter.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className="space-y-4 px-3.5 py-1.5">
      <div data-flow-step>
        <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-[#a7927c] uppercase">
          Matter Board
        </p>
        <ChainOfThought className="mt-2.5">
          {TIMELINE.map((step, index) => (
            <ChainOfThoughtStep key={step.title} defaultOpen={index === 1}>
              <ChainOfThoughtTrigger
                className={cn(
                  "text-[0.78rem] text-[#4f3c2d]",
                  step.state === "done" && "opacity-55",
                  step.state === "active" && "font-semibold text-[#2f2014]"
                )}
              >
                {step.title}
              </ChainOfThoughtTrigger>
              <ChainOfThoughtContent className="pb-1">
                <ChainOfThoughtItem className="text-[0.7rem] leading-4.5 text-[#84715e]">
                  {step.description}
                </ChainOfThoughtItem>
                {step.state === "active" ? (
                  <ChainOfThoughtItem className="pt-1">
                    <Reasoning className="px-0.5 py-1">
                      <ReasoningTrigger className="text-[0.68rem] font-medium tracking-[0.12em] text-[#6b533e] uppercase">
                        Reasoning
                      </ReasoningTrigger>
                      <ReasoningContent
                        contentClassName="mt-2 prose-p:my-0 prose-p:text-[0.68rem] prose-p:leading-4.5 prose-p:text-[#7b6754]"
                        markdown
                      >
                        Confirm clause, notice method, effective date. Compare source file against governing language before drafting response.
                      </ReasoningContent>
                    </Reasoning>
                  </ChainOfThoughtItem>
                ) : null}
              </ChainOfThoughtContent>
            </ChainOfThoughtStep>
          ))}
        </ChainOfThought>
      </div>

      <div data-flow-step>
        <div className="flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.14em] text-[#4f3c2d] uppercase">
          <Sparkles className="size-4" />
          Thinking
        </div>
        <div className="mt-2">
          {isThinking ? (
            <TextShimmerWave className="text-[0.7rem] text-[#7b6754]" duration={1}>
              Comparing clauses, timing, service method, and next action.
            </TextShimmerWave>
          ) : (
            <p className="text-[0.68rem] leading-4.5 text-[#7b6754]">
              Waiting for the next matter update.
            </p>
          )}
        </div>
      </div>

      <div data-flow-step>
        <div className="flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.14em] text-[#4f3c2d] uppercase">
          <Quote className="size-4" />
          Quotes
        </div>
        <div className="mt-2 space-y-1.5">
          {WORKFLOW_QUOTES.map((quote) => (
            <div
              key={quote}
              className="px-0 text-[0.68rem] leading-4.5 text-[#7b6754]"
            >
              <AnimatedText>{quote}</AnimatedText>
            </div>
          ))}
        </div>
      </div>

      <div data-flow-step>
        <div className="flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.14em] text-[#4f3c2d] uppercase">
          <ExternalLink className="size-4" />
          Sources
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WORKFLOW_SOURCES.map((source) => (
            <Source key={source.href} href={source.href}>
              <SourceTrigger
                label={source.label}
                showFavicon
                className="h-6 rounded-full bg-[#f6efe4] px-2 text-[0.65rem] text-[#6b533e] hover:bg-[#efe6d7]"
              />
              <SourceContent
                title={source.title}
                description={source.description}
              />
            </Source>
          ))}
        </div>

        <div className="mt-3 px-0 py-1">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.14em] text-[#4f3c2d] uppercase">
            <Sparkles className="size-4" />
            Citations
          </div>
          <ul className="mt-2 space-y-1 text-[0.66rem] leading-4.5 text-[#7b6754]">
            <li>Section 8.1 notice clause</li>
            <li>Section 12 service method</li>
            <li>State Code 104.B</li>
          </ul>
        </div>
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

type AttachmentPreviewProps = {
  attachment: AttachmentItem
  onRemove: (id: string) => void
}

function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  const isImage = attachment.type.startsWith("image/")
  const ext = attachment.name.split(".").pop()?.toUpperCase() ?? "FILE"

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="relative inline-flex size-12 items-center justify-center overflow-hidden rounded-xl bg-[#f6efe4]">
          {isImage && attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center bg-white text-[#7a6755]">
              <FileText className="size-4" />
              <span className="mt-1 text-[0.45rem] leading-none">{ext}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-white/92 text-[#9b866f] shadow-sm"
            aria-label={`Remove ${attachment.name}`}
          >
            <X className="size-2.5" />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent>{attachment.name}</TooltipContent>
    </Tooltip>
  )
}

function MessageAttachmentSquare({ attachment }: { attachment: AttachmentItem }) {
  const isImage = attachment.type.startsWith("image/")
  const ext = attachment.name.split(".").pop()?.toUpperCase() ?? "FILE"

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="inline-flex size-14 items-center justify-center overflow-hidden rounded-xl bg-[#f6efe4]">
          {isImage && attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center bg-white text-[#7a6755]">
              <FileText className="size-4.5" />
              <span className="mt-1 text-[0.48rem] leading-none">{ext}</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{attachment.name}</TooltipContent>
    </Tooltip>
  )
}

type ChatSidebarProps = {
  side?: "left" | "right"
  folders: FolderItem[]
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  activeFileId: string | null
  onSelectFile: (file: FileItem) => void
  onCreateDocument: () => void
  onCreateFolder: () => void
  onRenameFolder: (folderId: string) => void
  onOpenEditor: () => void
  onDeleteFile: (fileId: string) => void
  onMoveFile: (fileId: string, targetFolderId?: string) => void
  hasConversation?: boolean
  isThinking?: boolean
}

type AnimatedTextProps = {
  children: ReactNode
  className?: string
  per?: "char" | "word"
}

function AnimatedText({ children, className, per = "word" }: AnimatedTextProps) {
  return typeof children === "string" ? (
    <TextEffect className={className} per={per} preset="fade">
      {children}
    </TextEffect>
  ) : (
    <span className={className}>{children}</span>
  )
}

const animatedMarkdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-6 mb-3 text-[1rem] font-semibold text-[#4d392b]">
      <AnimatedText>{children}</AnimatedText>
    </h2>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-4 text-[0.92rem] leading-7 text-[#5b4838]">
      <AnimatedText>{children}</AnimatedText>
    </p>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="text-[0.92rem] leading-7 text-[#5b4838]">
      <AnimatedText>{children}</AnimatedText>
    </li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-4 border-l-2 border-[#e8c58b] pl-4 italic text-[#75604b]">
      <AnimatedText>{children}</AnimatedText>
    </blockquote>
  ),
}

export function ChatSidebar({
  side = "left",
  folders,
  expandedFolders,
  onToggleFolder,
  activeFileId,
  onSelectFile,
  onCreateDocument,
  onCreateFolder,
  onRenameFolder,
  onOpenEditor,
  onDeleteFile,
  onMoveFile,
  hasConversation = false,
  isThinking = false,
}: ChatSidebarProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { open, openRight } = useSidebar()
  const isOpen = side === "right" ? openRight : open

  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    gsap.fromTo(
      panelRef.current,
      {
        opacity: 0,
        x: side === "right" ? 18 : -18,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.28,
        ease: "power2.out",
      }
    )
  }, [isOpen, side])

  return (
    <Sidebar side={side} className="z-30">
      <div ref={panelRef} data-animate-panel className="flex size-full flex-col">
        <SidebarHeader className="group/sidebar-head relative px-3.5 py-2.5">
          {side === "right" ? (
            <div className="h-5" />
          ) : (
            <div className="flex justify-center py-0.5">
              <img src={logoMark} alt="JusticePath" className="h-auto w-[3.1rem]" />
            </div>
          )}
          <SidebarHoverCloseButton side={side} />
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto py-1">
          {side === "right" ? (
            <WorkflowTimeline hasConversation={hasConversation} isThinking={isThinking} />
          ) : (
            <div className="space-y-4 px-3.5">
              <div className="space-y-1.5">
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-[#a7927c] uppercase">
                  Workspace
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <button
                    type="button"
                    onClick={onCreateDocument}
                    className="flex h-8 items-center gap-2 rounded-full px-2 text-[0.72rem] font-medium text-[#4f3c2d] transition hover:bg-[#f4ecde]"
                    aria-label="New document"
                    title="New document"
                  >
                    <Plus className="size-4" />
                    New document
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onCreateFolder}
                      className="flex h-8 flex-1 items-center gap-2 rounded-full px-2 text-[0.7rem] text-[#7a6755] transition hover:bg-[#f4ecde] hover:text-[#4f3c2d]"
                      aria-label="New folder"
                      title="New folder"
                    >
                      <FolderPlus className="size-3.5" />
                      Folder
                    </button>
                    <NavLink
                      to="/settings"
                      className="flex h-8 flex-1 items-center gap-2 rounded-full px-2 text-[0.7rem] text-[#7a6755] transition hover:bg-[#f4ecde] hover:text-[#4f3c2d]"
                      aria-label="Settings"
                      title="Settings"
                    >
                      <Settings2 className="size-3.5" />
                      Settings
                    </NavLink>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-[#a7927c] uppercase">
                  Folders
                </p>
                <span className="text-[0.62rem] text-[#b19a84]">{folders.length}</span>
              </div>

              <Accordion
                key={Array.from(expandedFolders).sort().join(",")}
                defaultValue={Array.from(expandedFolders)}
                className="space-y-2"
              >
                {folders.map((folder) => {
                  const isFolderOpen = expandedFolders.has(folder.id)
                  return (
                    <AccordionItem key={folder.id} value={folder.id} className="py-0.5">
                      <AccordionTrigger
                        value={folder.id}
                        onClick={() => onToggleFolder(folder.id)}
                        className="w-full text-left text-[#5a4737]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {isFolderOpen ? (
                              <FolderOpen className="size-4 shrink-0 text-[#7c6348]" />
                            ) : (
                              <Folder className="size-4 shrink-0 text-[#7c6348]" />
                            )}
                            <span className="truncate text-[0.7rem] font-semibold">
                              {folder.name}
                            </span>
                          </div>
                          <ChevronUp className="size-3.5 shrink-0 transition-transform duration-200 group-data-[expanded=true]:-rotate-180" />
                        </div>
                      </AccordionTrigger>

                      <AccordionContent value={folder.id} className="pt-1.5">
                        <div className="mb-1 flex items-center justify-end pr-1">
                          <button
                            type="button"
                            onClick={() => onRenameFolder(folder.id)}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.62rem] text-[#b3a59a] transition hover:bg-[#f4ecde] hover:text-[#4f3c2d]"
                            title="Rename folder"
                          >
                            <FolderPen className="size-3" />
                            Rename
                          </button>
                        </div>
                        <SidebarMenu className="gap-0.5 pl-4">
                          {folder.files.map((file) => (
                            <SidebarMenuItem key={file.id}>
                              <div className="group/file-row flex items-center gap-1.5 py-1">
                                {file.ext === "txt" || file.name.includes("State Code") ? (
                                  <BookOpen className="size-3.25 shrink-0 text-[#94826f]" />
                                ) : (
                                  <FileText className="size-3.25 shrink-0 text-[#94826f]" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSelectFile(file)}
                                  className={cn(
                                    "min-w-0 flex-1 truncate whitespace-nowrap text-left text-[0.64rem] leading-4 text-[#7a6755]",
                                    activeFileId === file.id && "font-semibold text-[#2f2014]"
                                  )}
                                  title={file.name}
                                >
                                  {file.name}
                                </button>
                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/file-row:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => onMoveFile(file.id)}
                                    className="rounded-full p-1 text-[#b3a59a] transition hover:text-[#4f3c2d]"
                                    aria-label={`Move ${file.name}`}
                                    title="Move file"
                                  >
                                    <ArrowRightLeft className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectFile(file)
                                      onOpenEditor()
                                    }}
                                    className="rounded-full p-1 text-[#b3a59a] transition hover:text-[#4f3c2d]"
                                    aria-label={`Edit ${file.name}`}
                                    title="Edit document"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteFile(file.id)}
                                    className="rounded-full p-1 text-[#d5a09a] transition hover:text-[#c26c62]"
                                    aria-label={`Delete ${file.name}`}
                                    title="Delete document"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              </div>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          )}
        </SidebarContent>

        {side === "left" ? (
          <SidebarFooter className="px-3.5 py-3">
            <NavLink
              to="/settings"
              className="flex items-center gap-2.5 rounded-[14px] px-1.5 py-1.5 text-[#4f3c2d] transition hover:bg-[#f4ecde]"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-[#f0d9aa] text-[0.88rem] font-semibold text-[#4f3c2d]">
                JP
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.78rem] font-semibold text-[#3f3024]">
                  JusticePath AI
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[0.64rem] text-[#9b866f]">
                  <ShieldCheck className="size-3" />
                  Legal Assistant
                </div>
              </div>
              <Settings2 className="size-3.5 text-[#9b866f]" />
            </NavLink>
          </SidebarFooter>
        ) : null}
      </div>
    </Sidebar>
  )
}

type ChatContentProps = {
  activeFile: FileItem | null
  onOpenEditor: () => void
  onDocumentChange: (value: string) => void
  onConversationStateChange?: (hasConversation: boolean) => void
}

export function ChatContent({
  activeFile,
  onOpenEditor: _onOpenEditor,
  onDocumentChange: _onDocumentChange,
  onConversationStateChange,
}: ChatContentProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [listening, setListening] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const streamAnchorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const streamTimerRef = useRef<number | null>(null)

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value)
    toast("Copied")
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function scrollToGeneratedText(behavior: ScrollBehavior = "auto") {
    requestAnimationFrame(() => {
      streamAnchorRef.current?.scrollIntoView({
        block: "end",
        behavior,
      })

      if (!chatContainerRef.current) return
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      })
    })
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      if (streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    scrollToGeneratedText(isLoading ? "auto" : "smooth")
  }, [chatMessages, isLoading])

  useEffect(() => {
    onConversationStateChange?.(chatMessages.length > 0)
  }, [chatMessages.length, onConversationStateChange])

  function toggleVoice() {
    const speechApi = (
      window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor
        webkitSpeechRecognition?: SpeechRecognitionConstructor
      }
    ).SpeechRecognition ??
      (
        window as typeof window & {
          webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
      ).webkitSpeechRecognition

    if (!speechApi) {
      toast.warning("Voice input unavailable")
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      toast("Voice capture stopped")
      return
    }

    const recognition = new speechApi()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim()

      setPrompt(transcript)
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
    toast("Voice capture started")
  }

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return

    const submittedPrompt = prompt.trim()
    const shouldSuggestLawyers = LAWYER_QUERY_RE.test(submittedPrompt)
    const submittedAttachments = attachments
    const userId = Date.now()
    const assistantId = userId + 1

    const userMsg: ChatMessage = {
      id: userId,
      role: "user",
      content: submittedPrompt,
      attachments: submittedAttachments,
    }

    setChatMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        suggestLawyers: shouldSuggestLawyers,
        revealLawyers: false,
      },
    ])
    setPrompt("")
    setAttachments([])
    setIsLoading(true)
    toast("Prompt sent")

    const context = activeFile ? `Based on ${activeFile.name}: ` : ""
    const fullResponse = `${context}${
      submittedPrompt.endsWith("?")
        ? "I reviewed clause, notice method, and deadline."
        : "I prepared summary, risk points, and next move."
    }

> "Confirm the operative clause language, the required notice method, and the effective date before sending."

## Key Takeaways

State controlling provision clearly.

List notice deadline and delivery method.

Prepare next draft from selected record.`

    let cursor = 0
    const stride = Math.max(2, Math.ceil(fullResponse.length / 70))
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current)
    }

    streamTimerRef.current = window.setInterval(() => {
      cursor = Math.min(fullResponse.length, cursor + stride)
      const nextContent = fullResponse.slice(0, cursor)

      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, content: nextContent } : message
        )
      )
      scrollToGeneratedText("auto")

      if (cursor >= fullResponse.length) {
        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, revealLawyers: shouldSuggestLawyers }
              : message
          )
        )
        if (streamTimerRef.current) {
          window.clearInterval(streamTimerRef.current)
          streamTimerRef.current = null
        }
        setIsLoading(false)
      }
    }, 45)
  }

  function startEditingMessage(message: ChatMessage) {
    setEditingMessageId(message.id)
    setEditingValue(message.content)
    toast("Editing message")
  }

  function saveEditedMessage(messageId: number) {
    setChatMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, content: editingValue.trim() } : message
      )
    )
    setEditingMessageId(null)
    setEditingValue("")
    toast("Message updated")
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fcf7ee]">
      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-4 pb-64 pt-4 md:pb-72 md:pt-5">
            {chatMessages.length === 0 ? (
              <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 text-center">
                <div>
                  <h1 className="text-[clamp(1.4rem,2.2vw,2.05rem)] font-normal tracking-[-0.03em] text-[#6f5d4d]">
                    Start a legal task.
                  </h1>
                  <p className="mt-3 text-[0.86rem] text-[#9b866f]">
                    Ask for review, drafting, citation, or strategy.
                  </p>
                </div>
              </div>
            ) : null}

            {chatMessages.map((message, index) => {
              const isAssistant = message.role === "assistant"
              const isLastMessage = index === chatMessages.length - 1

              return (
                <Message
                  key={message.id}
                  className={cn(
                    "mx-auto mb-5 flex w-full max-w-5xl flex-col gap-1 px-4",
                    isAssistant ? "items-start" : "items-end"
                  )}
                >
                  {isAssistant ? (
                    <div className="group flex w-full items-start gap-4">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3e2bd] text-[#36271a]">
                        <Scale className="size-4" />
                      </div>

                      <div className="w-full max-w-[54rem] pt-1 text-[#5b4838]">
                        {message.content ? (
                          <Markdown
                            components={animatedMarkdownComponents}
                            className="text-[0.88rem] leading-6.5 [&_ol]:ml-5 [&_ol]:space-y-2 [&_ul]:ml-5 [&_ul]:space-y-2 [&_strong]:font-semibold [&_strong]:text-[#463528]"
                          >
                            {message.content}
                          </Markdown>
                        ) : (
                          <div className="px-0.5 py-1 text-[#6d5a48]">
                            <TextShimmerWave className="font-mono text-[0.78rem]" duration={1}>
                              Generating legal analysis...
                            </TextShimmerWave>
                          </div>
                        )}

                        {message.revealLawyers ? <InlineLawyerSuggestions /> : null}
                      </div>

                      <MessageActions
                        className={cn(
                          "-ml-2 mt-2 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                          isLastMessage && "opacity-100"
                        )}
                      >
                        <MessageAction tooltip="Copy">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full"
                            onClick={() => copyText(message.content)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  ) : (
                    <div className="group flex w-full max-w-[48rem] flex-col items-end gap-1">
                      <div className="px-1 py-1 text-[0.88rem] leading-6 text-[#624f3d]">
                        {message.attachments?.length ? (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {message.attachments.map((attachment) => (
                              <MessageAttachmentSquare
                                key={attachment.id}
                                attachment={attachment}
                              />
                            ))}
                          </div>
                        ) : null}

                        {editingMessageId === message.id ? (
                          <div className="relative">
                            <textarea
                              value={editingValue}
                              onChange={(event) => setEditingValue(event.target.value)}
                              onKeyDown={(event) => {
                                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                                  event.preventDefault()
                                  saveEditedMessage(message.id)
                                }

                                if (event.key === "Escape") {
                                  event.preventDefault()
                                  setEditingMessageId(null)
                                  setEditingValue("")
                                  toast("Edit canceled")
                                }
                              }}
                              style={{
                                minHeight: `${Math.max(28, message.content.split("\n").length * 24)}px`,
                                height: `${Math.max(28, message.content.split("\n").length * 24)}px`,
                              }}
                              className="w-full resize-none bg-transparent px-1 py-1.5 text-[0.88rem] leading-6 outline-none"
                            />
                            <div className="absolute right-0 top-0 flex items-center gap-1 bg-[#fcf7ee]/95 pl-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-full"
                                onClick={() => {
                                  setEditingMessageId(null)
                                  setEditingValue("")
                                  toast("Edit canceled")
                                }}
                              >
                                <X className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                className="size-7 rounded-full"
                                onClick={() => saveEditedMessage(message.id)}
                              >
                                <Check className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : message.content ? (
                          message.content
                        ) : null}
                      </div>
                      <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <MessageAction tooltip="Edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full"
                            onClick={() => startEditingMessage(message)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Copy">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full"
                            onClick={() => copyText(message.content)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  )}
                </Message>
              )
            })}
            <ChatContainerScrollAnchor
              ref={streamAnchorRef}
              className="h-40 scroll-mt-72"
            />
          </ChatContainerContent>

          <div className="absolute bottom-44 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-[#fcf7ee] via-[#fcf7ee]/97 to-transparent px-4 pb-5 pt-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
          <div className="pointer-events-auto flex w-[min(100vw-2rem,52rem)] flex-wrap justify-center gap-2">
            {QUICK_PROMPTS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setPrompt(suggestion)
                  toast(`Suggestion loaded: ${suggestion}`)
                }}
                className="rounded-full bg-white/90 px-3 py-1.5 text-[0.72rem] text-[#7a6755] shadow-[0_8px_22px_rgba(92,70,46,0.08)] transition hover:text-[#4f3c2d]"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="pointer-events-auto relative z-10 w-[min(100vw-2rem,52rem)] rounded-[1.25rem] border border-[#eadfcd] bg-white p-0 shadow-[0_18px_50px_rgba(204,173,125,0.28)]"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const nextFiles = Array.from(event.target.files ?? []).map((file) => ({
                  id: `${file.name}-${file.lastModified}`,
                  name: file.name,
                  type: file.type,
                  previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                }))
                if (nextFiles.length) {
                  setAttachments((prev) => [...prev, ...nextFiles])
                  toast(`${nextFiles.length} file${nextFiles.length > 1 ? "s" : ""} added`)
                }
                event.target.value = ""
              }}
            />
            {attachments.length ? (
              <div className="flex flex-wrap gap-2 px-4 pt-4">
                {attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={(id) =>
                      setAttachments((prev) => {
                        const removed = prev.find((item) => item.id === id)
                        if (removed?.previewUrl) {
                          URL.revokeObjectURL(removed.previewUrl)
                        }
                        return prev.filter((item) => item.id !== id)
                      })
                    }
                  />
                ))}
              </div>
            ) : null}
            <PromptInputTextarea
              placeholder="Type your response or instructions here..."
              className="min-h-[78px] px-5 pt-4 pb-2 text-[0.92rem] leading-6 text-[#5d4937] placeholder:text-[#b39d88]"
            />
            <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-0">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <PromptInputAction tooltip="Append files">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full border border-[#eadfcd] px-3 text-[0.78rem] text-[#70553d] hover:bg-[#f7f0e5]"
                    onClick={openFilePicker}
                  >
                    <Plus className="size-3.5" />
                    Files
                  </Button>
                </PromptInputAction>
              </div>
              <PromptInputAction tooltip="Voice input">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-pressed={listening}
                  onClick={toggleVoice}
                  className={cn(
                    "size-9 rounded-full text-[#70553d] hover:bg-transparent hover:text-[#5c422b]",
                    listening && "bg-[#f6efe4] text-[#5c422b]"
                  )}
                >
                  {listening ? (
                    <span className="relative flex items-center justify-center">
                      <span className="absolute inline-flex size-7 animate-ping rounded-full bg-[#e6c58b]/55" />
                      <Square className="relative z-10 size-3.5 fill-current" />
                    </span>
                  ) : (
                    <Mic className="size-4.5" />
                  )}
                </Button>
              </PromptInputAction>
              <Button
                size="icon"
                disabled={(!prompt.trim() && attachments.length === 0) || isLoading}
                onClick={handleSubmit}
                className="size-10 rounded-[0.95rem] bg-[#6a4f34] text-white shadow-none hover:bg-[#5c442e]"
              >
                {isLoading ? (
                  <span className="size-4 rounded-sm bg-white" />
                ) : (
                  <SendHorizontal className="size-4.5" />
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
    folders: folderTree,
    expandedFolders,
    onToggleFolder: toggleFolder,
    activeFileId,
    onSelectFile: selectFile,
    onCreateDocument: () => {},
    onCreateFolder: () => {},
    onRenameFolder: () => {},
    onOpenEditor: () => {},
    onDeleteFile: () => {},
    onMoveFile: () => {},
  }

  return (
    <SidebarProvider>
      <ChatSidebar side="left" {...sidebarProps} />
      <SidebarInset>
        <ChatContent
          activeFile={activeFile}
          onOpenEditor={() => {}}
          onDocumentChange={() => {}}
        />
      </SidebarInset>
      <ChatSidebar side="right" {...sidebarProps} />
    </SidebarProvider>
  )
}
