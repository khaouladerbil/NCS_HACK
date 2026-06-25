import { useState } from "react"
import { Button } from "@heroui/react"

import { ChatWorkspace } from "@/components/chat/chat-workspace"

type WorkspaceMode = "consultant" | "editor" | "professor"

function EmptyMode({ label }: { label: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-6 pt-32 pb-24">
      <div className="rounded-3xl border border-border/80 bg-card/90 px-8 py-10 text-center text-sm text-muted-foreground shadow-sm backdrop-blur">
        {label} empty for now.
      </div>
    </div>
  )
}

export function WorkspaceModes() {
  const [mode, setMode] = useState<WorkspaceMode>("consultant")

  return (
    <div className="min-h-dvh">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4 pt-4 md:px-6 md:pt-6">
        <div className="pointer-events-auto flex w-full max-w-3xl items-center rounded-full border border-border/80 bg-card/92 p-1 shadow-sm backdrop-blur">
          <Button
            variant={mode === "consultant" ? "secondary" : "ghost"}
            className="flex-1 rounded-full"
            onPress={() => setMode("consultant")}
          >
            Consultant
          </Button>
          <div className="h-6 w-px bg-border/80" />
          <Button
            variant={mode === "editor" ? "secondary" : "ghost"}
            className="flex-1 rounded-full"
            onPress={() => setMode("editor")}
          >
            Editor
          </Button>
          <div className="h-6 w-px bg-border/80" />
          <Button
            variant={mode === "professor" ? "secondary" : "ghost"}
            className="flex-1 rounded-full"
            onPress={() => setMode("professor")}
          >
            Professor
          </Button>
        </div>
      </div>

      {mode === "consultant" ? <ChatWorkspace /> : null}
      {mode === "editor" ? <EmptyMode label="Editor" /> : null}
      {mode === "professor" ? <EmptyMode label="Professor" /> : null}
    </div>
  )
}
