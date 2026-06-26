"use client"

import {
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  GripVertical,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
  Quote,
  Scale,
  Sparkles,
  Settings2,
  Square,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "@heroui/react"
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react"
import { NavLink } from "react-router-dom"
import { gsap } from "gsap"
import { motion } from "motion/react"

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
import { Tree, TreeItem } from "@/components/ui/tree"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { OutlineItem } from "@/lib/document"
import type { WorkspaceMode } from "@/pages/assistant-page"
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
  responseContext?: ResponseContext
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

type ResponseReasoningStep = {
  id: string
  label: string
  detail: string
}

type ResponseSourceItem = {
  id: string
  href: string
  title: string
  description: string
  label: string
  quote: string
}

type ResponseCitation = {
  id: string
  label: string
  sourceId: string
  quote: string
}

type ResponseParagraph = {
  id: string
  text: string
  citationIds: string[]
}

export type ResponseContext = {
  thinking: string
  reasoningSteps: ResponseReasoningStep[]
  sources: ResponseSourceItem[]
  citations: ResponseCitation[]
  answerParagraphs: ResponseParagraph[]
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

function buildResponseContext(prompt: string, activeFile?: FileItem | null): ResponseContext {
  const fileLabel = activeFile?.name?.replace(/\.[^.]+$/, "") ?? "selected record"
  const sources: ResponseSourceItem[] = [
    {
      id: "notice-clause",
      href: "https://www.law.cornell.edu/wex/notice",
      title: "Notice requirement overview",
      description: "Background on formal notice obligations and delivery mechanics.",
      label: "Notice",
      quote:
        '"Written notice must be delivered no later than thirty (30) days before the intended effective date."',
    },
    {
      id: "service-clause",
      href: "https://www.law.cornell.edu/ucc/2/2-309",
      title: "Termination and reasonable notice",
      description: "Reference for termination timing and notice concepts.",
      label: "UCC 2-309",
      quote:
        '"Service by email is effective only when the agreement expressly permits electronic notice."',
    },
  ]

  const citations: ResponseCitation[] = [
    {
      id: "fn-1",
      label: "[1]",
      sourceId: "notice-clause",
      quote: sources[0].quote,
    },
    {
      id: "fn-2",
      label: "[2]",
      sourceId: "service-clause",
      quote: sources[1].quote,
    },
  ]

  return {
    thinking: `Reading ${fileLabel}, isolating operative clause, checking service method, then drafting answer for: ${prompt}`,
    reasoningSteps: [
      {
        id: "step-1",
        label: "Parse record",
        detail: `Locate controlling clause in ${fileLabel} and strip background noise.`,
      },
      {
        id: "step-2",
        label: "Test notice rule",
        detail: "Compare delivery deadline against quoted notice language.",
      },
      {
        id: "step-3",
        label: "Test service method",
        detail: "Check whether email counts or whether formal service still required.",
      },
      {
        id: "step-4",
        label: "Draft answer",
        detail: "State conclusion first, then support with linked authority.",
      },
    ],
    sources,
    citations,
    answerParagraphs: [
      {
        id: "p-1",
        text: `In ${fileLabel}, strongest reading is that written notice should be tied to the stated effective date before any next step goes out.`,
        citationIds: ["fn-1"],
      },
      {
        id: "p-2",
        text: "Email service should not be treated as sufficient unless the governing document expressly authorizes electronic notice.",
        citationIds: ["fn-2"],
      },
      {
        id: "p-3",
        text: "Practical next move: confirm clause text, state deadline cleanly, then send revised draft with the formal delivery method spelled out.",
        citationIds: ["fn-1", "fn-2"],
      },
    ],
  }
}

function WorkflowTimeline({
  hasConversation,
  isThinking,
  responseContext,
  activeCitationId,
  onCitationSelect,
}: {
  hasConversation: boolean
  isThinking: boolean
  responseContext?: ResponseContext | null
  activeCitationId?: string | null
  onCitationSelect?: (citationId: string) => void
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const activeCitation =
    responseContext?.citations.find((citation) => citation.id === activeCitationId) ?? null
  const activeSourceId = activeCitation?.sourceId ?? null

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
          <p className="text-[0.64rem] font-semibold tracking-[0.18em] text-[#5b6472] uppercase">
            Matter Board
          </p>
          <p className="mt-3 text-[0.74rem] leading-5 text-[#4b5563]">
            Empty until a prompt starts the matter.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className="space-y-3 px-3 py-1">
      <div data-flow-step>
        <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-[#5b6472] uppercase">
          Matter Board
        </p>
        <ChainOfThought className="mt-1.5">
          {TIMELINE.map((step, index) => (
            <ChainOfThoughtStep key={step.title} defaultOpen={index === 1}>
              <ChainOfThoughtTrigger
                className={cn(
                  "text-[0.72rem] text-[#374151]",
                  step.state === "done" && "opacity-55",
                  step.state === "active" && "font-semibold text-[#111827]"
                )}
              >
                {step.title}
              </ChainOfThoughtTrigger>
              <ChainOfThoughtContent className="pb-1">
                <ChainOfThoughtItem className="text-[0.64rem] leading-4 text-[#4b5563]">
                  {step.description}
                </ChainOfThoughtItem>
                {step.state === "active" ? (
                  <ChainOfThoughtItem className="pt-1">
                    <Reasoning className="px-0.5 py-0.5">
                      <ReasoningTrigger className="text-[0.62rem] font-medium tracking-[0.12em] text-[#374151] uppercase">
                        Reasoning
                      </ReasoningTrigger>
                      <ReasoningContent
                        contentClassName="mt-1.5 prose-p:my-0 prose-p:text-[0.62rem] prose-p:leading-4 prose-p:text-[#4b5563]"
                        markdown
                      >
                        {(responseContext?.reasoningSteps ?? []).map((step, index) =>
                          `${index + 1}. ${step.label}: ${step.detail}`
                        ).join("\n") || "Compare clauses, source text, and service method before drafting answer."}
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
        <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-[#374151] uppercase">
          <Sparkles className="size-4" />
          Thinking
        </div>
        <div className="mt-2">
          {isThinking ? (
            <TextShimmerWave className="text-[0.64rem] text-[#4b5563]" duration={1}>
              {responseContext?.thinking ?? "Comparing clauses, timing, service method, and next action."}
            </TextShimmerWave>
          ) : (
            <p className="text-[0.62rem] leading-4 text-[#4b5563]">
              Waiting for the next matter update.
            </p>
          )}
        </div>
      </div>

      <div data-flow-step>
        <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-[#374151] uppercase">
          <Quote className="size-4" />
          Quotes
        </div>
        <div className="mt-1.5 space-y-1">
          {(responseContext?.citations ?? []).map((citation) => (
            <button
              key={citation.id}
              type="button"
              onClick={() => onCitationSelect?.(citation.id)}
              className={cn(
                "block w-full rounded-md border border-transparent px-1.5 py-1 text-left text-[0.61rem] leading-4 text-[#4b5563] transition hover:border-[#d6dce5] hover:bg-[#f8fafc]",
                activeCitationId === citation.id &&
                  "border-[#6ee7d5] bg-[#dff7f2] text-[#0f766e] shadow-[inset_3px_0_0_0_#0f766e]"
              )}
            >
              <span className="mr-1 rounded-full bg-white/80 px-1 py-0.5 font-semibold text-[#374151]">
                {citation.label}
              </span>
              <AnimatedText>{citation.quote}</AnimatedText>
            </button>
          ))}
        </div>
      </div>

      <div data-flow-step>
        <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-[#374151] uppercase">
          <ExternalLink className="size-4" />
          Sources
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(responseContext?.sources ?? []).map((source) => (
            <Source key={source.href} href={source.href}>
              <SourceTrigger
                label={source.label}
                showFavicon
                className={cn(
                  "h-5 rounded-full border border-transparent bg-[#eef2f7] px-2 text-[0.6rem] text-[#374151] hover:border-[#d6dce5] hover:bg-[#e5ebf3]",
                  activeSourceId === source.id &&
                    "border-[#6ee7d5] bg-[#dff7f2] text-[#0f766e] shadow-[0_0_0_2px_rgba(15,118,110,0.1)]"
                )}
              />
              <SourceContent
                title={source.title}
                description={source.description}
              />
            </Source>
          ))}
        </div>

        <div className="mt-2 px-0 py-0.5">
          <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-[#374151] uppercase">
            <Sparkles className="size-4" />
            Citations
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[0.58rem] leading-3.5 text-[#4b5563]">
            {(responseContext?.citations ?? []).map((citation) => (
              <li key={citation.id}>
                <button
                  type="button"
                  onClick={() => onCitationSelect?.(citation.id)}
                  className={cn(
                    "rounded-md border border-transparent px-1.5 py-0.5 transition hover:border-[#d6dce5] hover:bg-[#eef2f7]",
                    activeCitationId === citation.id &&
                      "border-[#6ee7d5] bg-[#dff7f2] text-[#0f766e]"
                  )}
                >
                  {citation.label} {citation.sourceId === "notice-clause" ? "Notice clause" : "Service method"}
                </button>
              </li>
            ))}
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
  mode?: WorkspaceMode
  activeFile?: FileItem | null
  documentOutline?: OutlineItem[]
  folders: FolderItem[]
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  activeFileId: string | null
  onSelectFile: (file: FileItem) => void
  onCreateFolder: () => void
  onAddFile: (folderId: string) => void
  onRenameFolder: (folderId: string, name: string) => void
  onDeleteFolder: (folderId: string) => void
  onRenameFile?: (fileId: string) => void
  onOpenEditor: () => void
  onDeleteFile: (fileId: string) => void
  onMoveFile: (fileId: string, targetFolderId?: string, targetIndex?: number) => void
  hasConversation?: boolean
  isThinking?: boolean
  responseContext?: ResponseContext | null
  activeCitationId?: string | null
  onCitationSelect?: (citationId: string) => void
}

function ConditionalTooltip({
  show,
  content,
  children,
}: {
  show: boolean
  content: ReactNode
  children: ReactNode
}) {
  if (!show) return <>{children}</>

  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  )
}

function TruncatingFileLabel({
  label,
  fullPath,
  active,
  onClick,
  onRename,
}: {
  label: string
  fullPath: string
  active: boolean
  onClick: () => void
  onRename: () => void
}) {
  const labelRef = useRef<HTMLSpanElement | null>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    const node = labelRef.current
    if (!node) return

    const measure = () => {
      setTruncated(node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [label])

  const content = (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={(event) => {
        event.preventDefault()
        onRename()
      }}
      className={cn(
        "min-w-0 flex-1 text-left text-[0.5rem] leading-4 text-[#374151]",
        active && "font-semibold text-[#111827]"
      )}
    >
      <span
        ref={labelRef}
        className="block overflow-hidden"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {label}
      </span>
    </button>
  )

  return (
    <ConditionalTooltip show={truncated} content={fullPath}>
      {content}
    </ConditionalTooltip>
  )
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

function getStreamedParagraphs(
  paragraphs: ResponseParagraph[],
  streamedContent: string
) {
  const trimmedStream = streamedContent.trim()
  let remaining = trimmedStream.length

  return paragraphs.map((paragraph) => {
    if (remaining <= 0) {
      return {
        ...paragraph,
        visibleText: "",
        isComplete: false,
      }
    }

    const visibleLength = Math.min(paragraph.text.length, remaining)
    const visibleText = paragraph.text.slice(0, visibleLength).trimEnd()
    remaining = Math.max(0, remaining - paragraph.text.length - 1)

    return {
      ...paragraph,
      visibleText,
      isComplete: visibleLength >= paragraph.text.length,
    }
  })
}

function EditorUtilities({
  activeFile,
  documentOutline = [],
  onRenameFile,
}: {
  activeFile?: FileItem | null
  documentOutline?: OutlineItem[]
  onRenameFile?: (fileId: string) => void
}) {
  const title = activeFile?.name?.replace(/\.[^.]+$/, "") ?? "Untitled Draft"
  const versions = [
    { id: "v3", label: "Draft revised.", active: true, page: 2 },
    { id: "v2", label: "Notice clause inserted.", active: false, page: 1 },
    { id: "v1", label: "Initial scaffold.", active: false, page: 0 },
  ]

  return (
    <div className="px-3.5 py-2">
      <section className="border-b border-[#e5e7eb] pb-5">
        <p className="text-[0.68rem] font-semibold tracking-[0.05em] text-[#6b7280] uppercase">
          Document
        </p>
        <div className="group/title mt-2 flex items-center gap-1.5">
          <p className="min-w-0 flex-1 text-[0.92rem] font-semibold leading-5 break-words text-[#111827]">
            {title}
          </p>
          {activeFile ? (
            <button
              type="button"
              onClick={() => onRenameFile?.(activeFile.id)}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[#9ca3af] opacity-0 transition group-hover/title:opacity-100 hover:bg-[#eef2f7] hover:text-[#111827] focus:opacity-100"
              aria-label={`Rename ${activeFile.name}`}
              title="Rename"
            >
              <Pencil className="size-3" />
            </button>
          ) : null}
        </div>
      </section>

      <section className="border-b border-[#e5e7eb] py-5">
        <p className="text-[0.68rem] font-semibold tracking-[0.05em] text-[#6b7280] uppercase">
          Table of Contents
        </p>
        <div className="mt-2 space-y-1 text-[0.72rem] text-[#1f2937]">
          {documentOutline.length ? (
            documentOutline.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("editor:jump", { detail: { page: item.page } })
                  )
                }
                className="group/toc flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-[#f6f8fb]"
              >
                <span className="mt-[0.42rem] h-3 w-px bg-[#d6dce5]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.62rem] font-semibold text-[#94a3b8]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 font-medium leading-5">{item.label}</span>
                  </div>
                  <span className="ml-6 block text-[0.62rem] text-[#6b7280]">
                    Page {item.page + 1}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-[#6b7280]">Open document to populate TOC.</p>
          )}
        </div>
      </section>

      <section className="py-5">
        <p className="text-[0.68rem] font-semibold tracking-[0.05em] text-[#6b7280] uppercase">
          Version History
        </p>
        <div className="relative mt-3 space-y-3 text-[0.72rem] leading-5 text-[#4b5563] before:absolute before:left-[0.43rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[#e5e7eb]">
          {versions.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("editor:jump", { detail: { page: version.page } })
                )
              }
              className="relative flex w-full gap-2.5 rounded-md text-left transition hover:bg-[#f6f8fb]"
            >
              <span
                className={cn(
                  "relative z-10 mt-1 size-3 rounded-full border-2 border-white",
                  version.active ? "bg-[#0f766e]" : "bg-[#cbd5e1]"
                )}
              />
              <div className="min-w-0">
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.62rem] font-semibold",
                    version.active
                      ? "bg-[#dff7f2] text-[#0f766e]"
                      : "bg-[#eef2f7] text-[#6b7280]"
                  )}
                >
                  {version.id}
                </span>
                <p className="mt-1">{version.label}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

const animatedMarkdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-6 mb-3 text-[1rem] font-semibold text-[#111827]">
      <AnimatedText>{children}</AnimatedText>
    </h2>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-4 text-[0.92rem] leading-7 text-[#1f2937]">
      <AnimatedText>{children}</AnimatedText>
    </p>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="text-[0.92rem] leading-7 text-[#1f2937]">
      <AnimatedText>{children}</AnimatedText>
    </li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-4 border-l-2 border-[#cbd5e1] pl-4 italic text-[#4b5563]">
      <AnimatedText>{children}</AnimatedText>
    </blockquote>
  ),
}

export function ChatSidebar({
  side = "left",
  mode = "consultant",
  activeFile,
  documentOutline = [],
  folders,
  expandedFolders,
  onToggleFolder,
  activeFileId,
  onSelectFile,
  onCreateFolder,
  onAddFile,
  onRenameFolder,
  onDeleteFolder,
  onRenameFile,
  onOpenEditor,
  onDeleteFile,
  onMoveFile,
  hasConversation = false,
  isThinking = false,
  responseContext = null,
  activeCitationId = null,
  onCitationSelect,
}: ChatSidebarProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { open, openRight } = useSidebar()
  const isOpen = side === "right" ? openRight : open
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")

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
    <Sidebar
      side={side}
      className="z-50 [--sidebar-width:18.75rem]"
    >
      <motion.div
        ref={panelRef}
        data-animate-panel
        className="flex size-full flex-col will-change-transform"
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0.96,
          x: isOpen ? 0 : side === "right" ? 14 : -14,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <SidebarHeader className="group/sidebar-head relative px-2 py-2">
          {side === "right" ? (
            <div className="h-5" />
          ) : (
            <div className="flex justify-start py-0.5 pl-1">
              <img src={logoMark} alt="JusticePath" className="h-auto w-[3.1rem]" />
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto py-1">
          {side === "right" ? (
            mode === "editor" ? (
              <EditorUtilities
                activeFile={activeFile}
                documentOutline={documentOutline}
                onRenameFile={onRenameFile}
              />
            ) : (
              <WorkflowTimeline
                hasConversation={hasConversation}
                isThinking={isThinking}
                responseContext={responseContext}
                activeCitationId={activeCitationId}
                onCitationSelect={onCitationSelect}
              />
            )
          ) : (
            <div className="space-y-4 px-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-[#5b6472] uppercase">
                  Folders
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.7rem] font-medium text-[#4b5563]">
                    {folders.length} total
                  </span>
                  <button
                    type="button"
                    onClick={onCreateFolder}
                    className="inline-flex size-6 items-center justify-center rounded-full text-[#4b5563] transition hover:bg-[#eef2f7] hover:text-[#111827]"
                    aria-label="Add folder"
                    title="Add folder"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              <Tree
                aria-label="Files"
                className="w-full space-y-2"
                defaultExpandedKeys={Array.from(expandedFolders)}
              >
                {folders.map((folder) => {
                  const isFolderOpen = expandedFolders.has(folder.id)
                  const isEditingFolder = editingFolderId === folder.id
                  return (
                    <TreeItem
                      key={folder.id}
                      id={folder.id}
                      expanded={isFolderOpen}
                      onExpandedChange={() => onToggleFolder(folder.id)}
                      className="py-0.5"
                      contentClassName="pt-1.5"
                      title={
                        <div
                          className="flex items-start gap-1 rounded-xl"
                          onDoubleClick={(event) => {
                            event.stopPropagation()
                            setEditingFolderId(folder.id)
                            setEditingFolderName(folder.name)
                          }}
                          onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                          onDrop={() => {
                            if (draggingFileId) {
                              onMoveFile(draggingFileId, folder.id, 0)
                              setDraggingFileId(null)
                            }
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleFolder(folder.id)}
                            className="min-w-0 flex-1 text-left text-[#1f2937]"
                          >
                            <div className="flex items-center gap-2">
                              {isFolderOpen ? (
                                <FolderOpen className="size-4 shrink-0 text-[#4b5563]" />
                              ) : (
                                <Folder className="size-4 shrink-0 text-[#4b5563]" />
                              )}
                              {isEditingFolder ? (
                                <input
                                  value={editingFolderName}
                                  onChange={(event) => setEditingFolderName(event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault()
                                      onRenameFolder(folder.id, editingFolderName.trim())
                                      setEditingFolderId(null)
                                    }
                                    if (event.key === "Escape") {
                                      event.preventDefault()
                                      setEditingFolderId(null)
                                    }
                                  }}
                                  onBlur={() => {
                                    onRenameFolder(folder.id, editingFolderName.trim())
                                    setEditingFolderId(null)
                                  }}
                                  autoFocus
                                  className="h-7 flex-1 rounded-md border border-[#d6dce5] bg-white px-2 text-[0.82rem] font-semibold text-[#111827] outline-none focus:ring-2 focus:ring-[#94a3b8]/40"
                                />
                              ) : (
                                <span className="text-[0.9rem] font-semibold leading-4 break-words text-[#111827]">
                                  {folder.name}
                                </span>
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddFile(folder.id)}
                            className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#eef2f7] hover:text-[#111827]"
                            aria-label={`Add file to ${folder.name}`}
                            title="Add file"
                          >
                            <Plus className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFolder(folder.id)}
                            className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#fbe9e8] hover:text-[#9f2d20]"
                            aria-label={`Delete ${folder.name}`}
                            title="Delete folder"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      }
                    >
                      <div
                        onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                        onDrop={() => {
                          if (draggingFileId) {
                            onMoveFile(draggingFileId, folder.id)
                            setDraggingFileId(null)
                          }
                        }}
                      >
                        <SidebarMenu className="gap-0.5 pl-2">
                          {folder.files.map((file, fileIndex) => (
                            <motion.div
                              key={file.id}
                              layout
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.16, ease: "easeOut" }}
                            >
                              <SidebarMenuItem>
                                <div
                                  className="group/file-row flex items-center gap-1.5 py-1"
                                  onDragOver={(event: DragEvent<HTMLDivElement>) =>
                                    event.preventDefault()
                                  }
                                  onDrop={() => {
                                    if (draggingFileId) {
                                      onMoveFile(draggingFileId, folder.id, fileIndex)
                                      setDraggingFileId(null)
                                    }
                                  }}
                                >
                                  <button
                                    type="button"
                                    draggable
                                    onDragStart={() => setDraggingFileId(file.id)}
                                    onDragEnd={() => setDraggingFileId(null)}
                                    className="rounded-full p-0.5 text-[#9ca3af] transition hover:bg-[#eef2f7] hover:text-[#4b5563]"
                                    aria-label={`Drag ${file.name}`}
                                    title="Drag file"
                                  >
                                    <GripVertical className="size-3" />
                                  </button>
                                  {file.ext === "txt" || file.name.includes("State Code") ? (
                                    <BookOpen className="size-3.25 shrink-0 text-[#6b7280]" />
                                  ) : (
                                    <FileText className="size-3.25 shrink-0 text-[#6b7280]" />
                                  )}
                                  <TruncatingFileLabel
                                    label={file.name}
                                    fullPath={`${folder.name}/${file.name}`}
                                    active={activeFileId === file.id}
                                    onClick={() => onSelectFile(file)}
                                    onRename={() => onRenameFile?.(file.id)}
                                  />
                                  <div className="flex items-center opacity-0 transition-opacity group-hover/file-row:opacity-100 group-focus-within/file-row:opacity-100">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        render={
                                          <button
                                            type="button"
                                            className="rounded-full p-1 text-[#6b7280] transition hover:bg-[#eef2f7] hover:text-[#111827]"
                                            aria-label={`Actions for ${file.name}`}
                                          >
                                            <MoreHorizontal className="size-3.5" />
                                          </button>
                                        }
                                      />
                                      <DropdownMenuContent align="end" className="w-40 min-w-40">
                                        <DropdownMenuItem onClick={() => onRenameFile?.(file.id)}>
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            onSelectFile(file)
                                            onOpenEditor()
                                          }}
                                        >
                                          Replace
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() => onDeleteFile(file.id)}
                                        >
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </SidebarMenuItem>
                            </motion.div>
                          ))}
                        </SidebarMenu>
                      </div>
                    </TreeItem>
                  )
                })}
              </Tree>
            </div>
          )}
        </SidebarContent>

        {side === "left" ? (
          <SidebarFooter className="px-3.5 py-3">
            <NavLink
              to="/settings"
              className="mb-2 flex h-9 items-center gap-2 rounded-full px-2.5 text-[0.68rem] font-medium text-[#4b5563] transition hover:bg-[#eef2f7] hover:text-[#111827]"
              aria-label="Settings"
              title="Settings"
            >
              <Settings2 className="size-3.5" />
              Settings
            </NavLink>
          </SidebarFooter>
        ) : null}
      </motion.div>
    </Sidebar>
  )
}

type ChatContentProps = {
  activeFile: FileItem | null
  onOpenEditor: () => void
  onDocumentChange: (value: string) => void
  onConversationStateChange?: (hasConversation: boolean) => void
  onResponseContextChange?: (context: ResponseContext | null) => void
  activeCitationId?: string | null
  onActiveCitationChange?: (citationId: string | null) => void
}

export function ChatContent({
  activeFile,
  onOpenEditor: _onOpenEditor,
  onDocumentChange: _onDocumentChange,
  onConversationStateChange,
  onResponseContextChange,
  activeCitationId,
  onActiveCitationChange,
}: ChatContentProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [listening, setListening] = useState(false)
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
      if (streamTimerRef.current) window.clearInterval(streamTimerRef.current)
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

  function stopResponse() {
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current)
      streamTimerRef.current = null
    }
    setIsLoading(false)
    toast("Generation stopped")
  }

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return

    const submittedPrompt = prompt.trim()
    const shouldSuggestLawyers = LAWYER_QUERY_RE.test(submittedPrompt)
    const submittedAttachments = attachments
    const responseContext = buildResponseContext(submittedPrompt, activeFile)
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
        responseContext,
      },
    ])
    onResponseContextChange?.(responseContext)
    onActiveCitationChange?.(null)
    setPrompt("")
    setAttachments([])
    setIsLoading(true)
    toast("Prompt sent")

    const fullResponse = responseContext.answerParagraphs.map((paragraph) => paragraph.text).join(" ")

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

  function editPrompt(message: ChatMessage) {
    setPrompt(message.content)
    scrollToGeneratedText("smooth")
    toast("Prompt loaded")
  }

  function focusCitation(citationId: string) {
    onActiveCitationChange?.(citationId)
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f5f7]">
      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-4 pb-64 pt-4 md:pb-72 md:pt-5">
            {chatMessages.length === 0 ? (
              <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 text-center">
                <div>
                  <h1 className="text-[clamp(1.4rem,2.2vw,2.05rem)] font-normal tracking-[-0.03em] text-[#111827]">
                    Start a legal task.
                  </h1>
                  <p className="mt-3 text-[0.86rem] text-[#4b5563]">
                    Ask for review, drafting, citation, or strategy.
                  </p>
                </div>
              </div>
            ) : null}

            {chatMessages.map((message, index) => {
              const isAssistant = message.role === "assistant"
              const isLastMessage = index === chatMessages.length - 1
              const streamedParagraphs = message.responseContext
                ? getStreamedParagraphs(
                    message.responseContext.answerParagraphs,
                    message.content
                  )
                : []

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
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dbe5f0] text-[#111827]">
                        <Scale className="size-4" />
                      </div>

                      <div className="w-full max-w-[54rem] pt-1 text-[#1f2937]">
                        {message.content ? (
                          message.responseContext ? (
                            <div className="space-y-3">
                              {streamedParagraphs
                                .filter((paragraph) => paragraph.visibleText)
                                .map((paragraph) => (
                                  <p
                                    key={paragraph.id}
                                    className="text-[0.88rem] leading-6.5 text-[#1f2937]"
                                  >
                                    <AnimatedText>{paragraph.visibleText}</AnimatedText>
                                    {paragraph.isComplete
                                      ? paragraph.citationIds.map((citationId) => {
                                          const citation = message.responseContext?.citations.find(
                                            (item) => item.id === citationId
                                          )
                                          if (!citation) return null

                                          return (
                                            <button
                                              key={citation.id}
                                              type="button"
                                              onClick={() => focusCitation(citation.id)}
                                              className={cn(
                                                "ml-1 inline-flex min-w-4 -translate-y-1 items-center justify-center rounded-full border border-[#d6dce5] bg-white px-1 py-0.5 align-super text-[0.56rem] font-semibold leading-none text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-[#6ee7d5] hover:bg-[#dff7f2] hover:text-[#0f766e]",
                                                activeCitationId === citation.id &&
                                                  "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_0_0_2px_rgba(15,118,110,0.12)]"
                                              )}
                                            >
                                              {citation.label}
                                            </button>
                                          )
                                        })
                                      : null}
                                  </p>
                                ))}
                            </div>
                          ) : (
                            <Markdown
                              components={animatedMarkdownComponents}
                              className="text-[0.88rem] leading-6.5 [&_ol]:ml-5 [&_ol]:space-y-2 [&_ul]:ml-5 [&_ul]:space-y-2 [&_strong]:font-semibold [&_strong]:text-[#463528]"
                            >
                              {message.content}
                            </Markdown>
                          )
                        ) : (
                          <div className="px-0.5 py-1 text-[#4b5563]">
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
                      <div className="px-1 py-1 text-[0.88rem] leading-6 text-[#111827]">
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

                        {message.content ? (
                          message.content
                        ) : null}
                      </div>
                      <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <MessageAction tooltip="Edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full"
                            onClick={() => editPrompt(message)}
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

          <div className="absolute bottom-42 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-[#f4f5f7] via-[#f4f5f7]/98 to-transparent px-4 pb-4 pt-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="pointer-events-auto relative z-10 w-[min(100vw-2rem,52rem)] rounded-[1.25rem] border border-[#d6dce5] bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
          >
            {!prompt.trim() && attachments.length === 0 ? (
              <div className="overflow-x-auto px-4 pt-3">
                <div className="flex w-max min-w-full gap-2 pb-1">
                  {QUICK_PROMPTS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setPrompt(suggestion)
                        toast(`Suggestion loaded: ${suggestion}`)
                      }}
                      className="shrink-0 rounded-full bg-[#eef2f7] px-3 py-1.5 text-[0.72rem] text-[#374151] transition hover:bg-[#e5ebf3] hover:text-[#111827]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
              className="min-h-[74px] px-5 pt-4 pb-2 text-[0.92rem] leading-6 text-[#111827] placeholder:text-[#6b7280]"
            />
            <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-0">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <PromptInputAction tooltip="Append files">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full border border-[#d6dce5] px-3 text-[0.78rem] text-[#374151] hover:bg-[#eef2f7]"
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
                    "size-9 rounded-full text-[#374151] hover:bg-transparent hover:text-[#111827]",
                    listening && "bg-[#eef2f7] text-[#111827]"
                  )}
                >
                  {listening ? (
                    <span className="relative flex items-center justify-center">
                      <span className="absolute inline-flex size-7 animate-ping rounded-full bg-[#cbd5e1]/80" />
                      <Square className="relative z-10 size-3.5 fill-current" />
                    </span>
                  ) : (
                    <Mic className="size-4.5" />
                  )}
                </Button>
              </PromptInputAction>
              <Button
                size="icon"
                disabled={!isLoading && !prompt.trim() && attachments.length === 0}
                onClick={isLoading ? stopResponse : handleSubmit}
                className="size-10 rounded-[0.95rem] bg-[#111827] text-white shadow-none hover:bg-[#0f172a]"
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
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
    onCreateFolder: () => {},
    onAddFile: () => {},
    onRenameFolder: () => {},
    onDeleteFolder: () => {},
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
