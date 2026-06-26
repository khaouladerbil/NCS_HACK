import { useState } from "react"

import { ChatContent } from "@/components/chat/full-chat-app"
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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background">
        <div className="flex items-center justify-center">
          {MODES.map((modeItem) => (
            <Button
              key={modeItem.id}
              variant="ghost"
              size="sm"
              onClick={() => setMode(modeItem.id)}
              className={cn(
                "h-11 rounded-none px-6 text-xs font-medium",
                mode === modeItem.id
                  ? "border-b border-foreground text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {modeItem.label}
            </Button>
          ))}
        </div>
      </header>

      {mode === "consultant" ? (
        <ChatContent activeFile={activeFile} />
      ) : mode === "editor" ? (
        <EmptyMode label="Editor" />
      ) : (
        <EmptyMode label="Professor" />
      )}
    </div>
  )
}
