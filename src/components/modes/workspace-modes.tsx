import { useEffect, useState, type ReactNode } from "react"
import {
  BookOpen,
  Eye,
  FilePenLine,
  FileText,
  MessagesSquare,
  Minus,
  PencilLine,
  Plus,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { ChatContent, type ResponseContext } from "@/components/chat/full-chat-app"
import type { ResponseProgress } from "@/components/chat/full-chat-app"
import { AnimatedBackground } from "@/components/core/animated-background"
import {
  MarkdownEditorMode,
  type EditorToolbarAction,
  type EditorToolbarButton,
  type EditorToolbarState,
} from "@/components/modes/markdown-editor-mode"
import { ProfessorMode } from "@/components/modes/professor-mode"
import { cn } from "@/lib/utils"

import type { FileItem } from "@/components/chat/full-chat-app"
import type { WorkspaceMode } from "@/pages/assistant-page"

const MODES: { id: WorkspaceMode; label: string; icon: ReactNode }[] = [
  { id: "consultant", label: "Consultant", icon: <MessagesSquare className="size-4" /> },
  { id: "editor", label: "Editor", icon: <FilePenLine className="size-4" /> },
  { id: "professor", label: "Professor", icon: <BookOpen className="size-4" /> },
]

type WorkspaceModesProps = {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
  activeFile: FileItem | null
  documentValue: string
  onDocumentChange: (value: string) => void
  onConversationStateChange?: (hasConversation: boolean) => void
  onThinkingStateChange?: (isThinking: boolean) => void
  onResponseContextChange?: (context: ResponseContext | null) => void
  onResponseProgressChange?: (progress: ResponseProgress | null) => void
  activeCitationId?: string | null
  onActiveCitationChange?: (citationId: string | null) => void
}

export function WorkspaceModes({
  mode,
  onModeChange,
  activeFile,
  documentValue,
  onDocumentChange,
  onConversationStateChange,
  onThinkingStateChange,
  onResponseContextChange,
  onResponseProgressChange,
  activeCitationId,
  onActiveCitationChange,
}: WorkspaceModesProps) {
  const [toolbarState, setToolbarState] = useState<EditorToolbarState | null>(null)

  useEffect(() => {
    if (mode !== "editor") setToolbarState(null)
  }, [mode])

  function triggerEditorAction(action: EditorToolbarAction) {
    window.dispatchEvent(new CustomEvent("editor:toolbar-action", { detail: { action } }))
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(circle_at_top,_rgba(188,162,121,0.14),transparent_24%),linear-gradient(180deg,#f8f2e7_0%,#efe7d7_100%)]">
      <header className="sticky top-0 z-30 bg-[#f8f2e7]/88 backdrop-blur">
        <div className="relative min-h-[4.75rem] px-10 py-4">
          <div className="absolute right-[calc(50%+4.5rem)] top-1/2 hidden -translate-y-1/2 items-center gap-4 lg:flex">
            <AnimatePresence mode="popLayout">
              {mode === "editor" && toolbarState ? (
                <motion.div
                  key="left-toolbar"
                  initial={{ opacity: 0, x: 10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center gap-4"
                >
                  <ToolbarGroup>
                    <ToolbarIconButton
                      label="Zoom out"
                      icon={Minus}
                      onClick={() => triggerEditorAction("zoom-out")}
                    />
                    <span className="min-w-12 px-1 text-center text-[0.68rem] font-medium tracking-[0.14em] text-[#111827] uppercase">
                      {toolbarState.zoom}%
                    </span>
                    <ToolbarIconButton
                      label="Zoom in"
                      icon={Plus}
                      onClick={() => triggerEditorAction("zoom-in")}
                    />
                  </ToolbarGroup>
                  <ToolbarGroup>
                    {toolbarState.leftButtons.map((item) => (
                      <ToolbarIconButton
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        active={item.active}
                        onClick={() => triggerEditorAction(item.id)}
                      />
                    ))}
                  </ToolbarGroup>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#dcccb7] bg-white/88 px-3 py-2.5 shadow-[0_12px_28px_rgba(71,46,22,0.1)]"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <AnimatedBackground
              defaultValue={mode}
              onValueChange={(next) => onModeChange(next as WorkspaceMode)}
              className="rounded-full bg-[#f4ecdf]"
            >
              {MODES.map((modeItem) => (
                <button
                  key={modeItem.id}
                  data-id={modeItem.id}
                  type="button"
                  aria-label={modeItem.label}
                  title={modeItem.label}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full text-[#7a6655] transition-colors duration-100 focus-visible:outline-2",
                    mode === modeItem.id && "text-[#24170d]"
                  )}
                >
                  {modeItem.icon}
                </button>
              ))}
            </AnimatedBackground>
          </motion.div>

          <div className="absolute left-[calc(50%+4.5rem)] top-1/2 hidden -translate-y-1/2 items-center gap-4 lg:flex">
            <AnimatePresence mode="popLayout">
              {mode === "editor" && toolbarState ? (
                <motion.div
                  key="right-toolbar"
                  initial={{ opacity: 0, x: -10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center gap-4"
                >
                  <ToolbarGroup>
                    {toolbarState.rightButtons.map((item) => (
                      <ToolbarIconButton
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        active={item.active}
                        onClick={() => triggerEditorAction(item.id)}
                      />
                    ))}
                  </ToolbarGroup>
                  {toolbarState.isViewerFile ? (
                    <ToolbarGroup>
                      <ToolbarIconButton
                        label="View"
                        icon={Eye}
                        active={toolbarState.surfaceMode === "view"}
                        onClick={() => triggerEditorAction("view")}
                      />
                      {toolbarState.canEdit ? (
                        <ToolbarIconButton
                          label="Edit"
                          icon={PencilLine}
                          active={toolbarState.surfaceMode === "edit"}
                          onClick={() => triggerEditorAction("edit")}
                        />
                      ) : null}
                    </ToolbarGroup>
                  ) : null}
                  {toolbarState.sourceUrl ? (
                    <a
                      href={toolbarState.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#d6dce5] bg-white/85 px-3 text-[0.68rem] font-medium text-[#111827] shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
                    >
                      <FileText className="size-3.5" />
                      Source file
                    </a>
                  ) : null}
                  <ToolbarGroup>
                    <ToolbarTextButton
                      label="Export DOCX"
                      onClick={() => triggerEditorAction("export-docx")}
                    >
                      DOCX
                    </ToolbarTextButton>
                    <ToolbarTextButton
                      label="Export PDF"
                      onClick={() => triggerEditorAction("export-pdf")}
                    >
                      PDF
                    </ToolbarTextButton>
                  </ToolbarGroup>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {mode === "consultant" ? (
        <ChatContent
          activeFile={activeFile}
          onOpenEditor={() => onModeChange("editor")}
          onDocumentChange={onDocumentChange}
          onConversationStateChange={onConversationStateChange}
          onThinkingStateChange={onThinkingStateChange}
          onResponseContextChange={onResponseContextChange}
          onResponseProgressChange={onResponseProgressChange}
          activeCitationId={activeCitationId}
          onActiveCitationChange={onActiveCitationChange}
        />
      ) : mode === "editor" ? (
        <MarkdownEditorMode
          activeFile={activeFile}
          value={documentValue}
          onChange={onDocumentChange}
          onToolbarStateChange={setToolbarState}
        />
      ) : (
        <ProfessorMode />
      )}
    </div>
  )
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return (
      <div className="inline-flex items-center rounded-full border border-[#dcccb7] bg-white/88 px-2 py-2 shadow-[0_12px_28px_rgba(71,46,22,0.1)]">
      {children}
    </div>
  )
}

function ToolbarIconButton({
  label,
  icon: Icon,
  active = false,
  onClick,
}: {
  label: string
  icon: EditorToolbarButton["icon"]
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full text-[#7a6655] transition-colors duration-100 focus-visible:outline-2 lg:size-9",
        active && "bg-[#f4ecdf] text-[#24170d]"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function ToolbarTextButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 items-center justify-center rounded-full px-3 text-[0.66rem] font-semibold tracking-[0.14em] text-[#6d5640] transition-colors hover:bg-[#f4ecdf] hover:text-[#24170d] lg:h-9"
    >
      {children}
    </button>
  )
}
