import { BookOpen, FilePenLine, FileText, MessagesSquare } from "lucide-react"

import { ChatContent } from "@/components/chat/full-chat-app"
import { AnimatedBackground } from "@/components/core/animated-background"
import { MarkdownEditorMode } from "@/components/modes/markdown-editor-mode"
import { cn } from "@/lib/utils"

import type { FileItem } from "@/components/chat/full-chat-app"
import type { WorkspaceMode } from "@/pages/assistant-page"

const MODES: { id: WorkspaceMode; label: string; icon: React.ReactNode }[] = [
  { id: "consultant", label: "Consultant", icon: <MessagesSquare className="size-4" /> },
  { id: "editor", label: "Editor", icon: <FilePenLine className="size-4" /> },
  { id: "professor", label: "Professor", icon: <BookOpen className="size-4" /> },
]

function EmptyMode({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </div>
  )
}

type WorkspaceModesProps = {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
  activeFile: FileItem | null
  documentValue: string
  onDocumentChange: (value: string) => void
  onConversationStateChange?: (hasConversation: boolean) => void
}

export function WorkspaceModes({
  mode,
  onModeChange,
  activeFile,
  documentValue,
  onDocumentChange,
  onConversationStateChange,
}: WorkspaceModesProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fcf7ee]">
      <header className="sticky top-0 z-30 bg-[#fcf7ee]/94 backdrop-blur">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-1.5">
          <div className="min-w-0">
            <p className="text-[0.64rem] font-semibold tracking-[0.16em] text-[#9b866f] uppercase">
              {MODES.find((item) => item.id === mode)?.label}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[0.76rem] text-[#6b533e]">
              <FileText className="size-3.5" />
              <span className="truncate">
                {activeFile ? activeFile.name : "No file selected"}
              </span>
            </div>
          </div>
          <div className="rounded-[18px] border border-[#e6dbc9] bg-white/85 p-1.5 shadow-[0_8px_24px_rgba(112,90,68,0.08)]">
            <AnimatedBackground
              defaultValue={mode}
              onValueChange={(next) => onModeChange(next as WorkspaceMode)}
              className="rounded-[12px] bg-[#f1e6d4]"
            >
              {MODES.map((modeItem) => (
                <button
                  key={modeItem.id}
                  data-id={modeItem.id}
                  type="button"
                  aria-label={modeItem.label}
                  title={modeItem.label}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-[10px] text-[#8f7b68] transition-colors duration-100 focus-visible:outline-2",
                    mode === modeItem.id && "text-[#4c3a2c]"
                  )}
                >
                  {modeItem.icon}
                </button>
              ))}
            </AnimatedBackground>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[0.62rem] font-semibold tracking-[0.16em] text-[#9b866f] uppercase">
              Current State
            </p>
            <p className="mt-1 truncate text-[0.74rem] text-[#6b533e]">
              {mode === "consultant"
                ? "Ready for prompt"
                : mode === "editor"
                  ? activeFile
                    ? "Editing current document"
                    : "Draft ready"
                  : "Waiting"}
            </p>
          </div>
        </div>
      </header>

      {mode === "consultant" ? (
        <ChatContent
          activeFile={activeFile}
          onOpenEditor={() => onModeChange("editor")}
          onDocumentChange={onDocumentChange}
          onConversationStateChange={onConversationStateChange}
        />
      ) : mode === "editor" ? (
        <MarkdownEditorMode
          activeFile={activeFile}
          value={documentValue}
          onChange={onDocumentChange}
        />
      ) : (
        <EmptyMode label="Professor" />
      )}
    </div>
  )
}
