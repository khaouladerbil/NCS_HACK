import { useState } from "react"

import { ChatContent } from "@/components/chat/full-chat-app"
import { MarkdownEditorMode } from "@/components/modes/markdown-editor-mode"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { FileItem } from "@/components/chat/full-chat-app"

type WorkspaceMode = "consultant" | "editor" | "professor"

const MODES: { id: WorkspaceMode; label: string }[] = [
  { id: "consultant", label: "Consultant" },
  { id: "editor", label: "Editor" },
  { id: "professor", label: "Professor" },
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
  activeFile: FileItem | null
}

export function WorkspaceModes({ activeFile }: WorkspaceModesProps) {
  const [mode, setMode] = useState<WorkspaceMode>("consultant")

  return (
    <div className="flex min-h-dvh flex-col bg-[#fcf7ee]">
      <header className="sticky top-0 z-30 border-b border-[#e8decf] bg-[#fcf7ee]/95 backdrop-blur">
        <div className="flex items-center justify-center px-4 py-5">
          <div className="inline-flex rounded-[30px] border border-[#eadfcd] bg-[#ebe1cf] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          {MODES.map((modeItem) => (
            <Button
              key={modeItem.id}
              variant="ghost"
              size="sm"
              onClick={() => setMode(modeItem.id)}
              className={cn(
                "h-14 min-w-[11rem] rounded-[24px] px-8 text-[1.05rem] font-medium shadow-none transition-all",
                mode === modeItem.id
                  ? "bg-white text-[#5d4937] shadow-[0_2px_6px_rgba(92,70,46,0.14)]"
                  : "text-[#7b6754] hover:bg-transparent hover:text-[#5d4937]"
              )}
            >
              {modeItem.label}
            </Button>
          ))}
          </div>
        </div>
      </header>

      {mode === "consultant" ? (
        <ChatContent activeFile={activeFile} />
      ) : mode === "editor" ? (
        <MarkdownEditorMode activeFile={activeFile} />
      ) : (
        <EmptyMode label="Professor" />
      )}
    </div>
  )
}
