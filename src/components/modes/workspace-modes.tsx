import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChatContent } from "@/components/chat/full-chat-app"
import type { FileItem } from "@/components/chat/full-chat-app"

type WorkspaceMode = "consultant" | "editor" | "professor"

const MODES: { id: WorkspaceMode; label: string }[] = [
  { id: "consultant", label: "Consultant" },
  { id: "editor", label: "Editor" },
  { id: "professor", label: "Professor" },
]

function EmptyMode({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="rounded-2xl border border-border/80 bg-card/90 px-8 py-10 text-center text-sm text-muted-foreground shadow-sm backdrop-blur">
        {label} — coming soon.
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
    <div className="flex flex-col min-h-dvh">
      {/* ── Unified top bar ── */}
      <header className="bg-background/90 backdrop-blur border-b border-border/60 z-20 flex h-12 items-center px-2 gap-2 shrink-0">
        {/* Left sidebar trigger */}
        <SidebarTrigger side="left" className="shrink-0" />

        {/* Mode tabs — centred */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center rounded-full border border-border/70 bg-muted/50 p-0.5 gap-0">
            {MODES.map((m, i) => (
              <div key={m.id} className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "h-7 rounded-full px-4 text-xs font-medium transition-all",
                    mode === m.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </Button>
                {i < MODES.length - 1 && (
                  <div className="h-3.5 w-px bg-border/60" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar trigger — mirrored icon */}
        <SidebarTrigger
          side="right"
          className="shrink-0 scale-x-[-1]"
        />
      </header>

      {/* ── Mode content ── */}
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
