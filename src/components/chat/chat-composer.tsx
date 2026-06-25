import { ArrowUp, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"

type ChatComposerProps = {
  draft: string
  loading: boolean
  onDraftChange: (value: string) => void
  onReset: () => void
  onSubmit: () => void
}

export function ChatComposer({
  draft,
  loading,
  onDraftChange,
  onReset,
  onSubmit,
}: ChatComposerProps) {
  return (
    <PromptInput
      value={draft}
      onValueChange={onDraftChange}
      onSubmit={onSubmit}
      isLoading={loading}
      className="rounded-3xl border-border bg-background/96 p-3 shadow-lg shadow-black/5 backdrop-blur"
    >
      <PromptInputTextarea
        placeholder="Issue, deadline, output."
        className="min-h-16 text-sm leading-6 text-foreground placeholder:text-muted-foreground"
      />
        <PromptInputActions className="mt-2 justify-between">
          <PromptInputAction tooltip="Reset">
            <span
              role="button"
              tabIndex={0}
              className="inline-flex size-8 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              onClick={onReset}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onReset()
                }
              }}
            >
              <RotateCcw className="size-4" />
            </span>
          </PromptInputAction>
          <Button className="rounded-full" size="icon-sm" onClick={onSubmit} disabled={loading}>
            <ArrowUp className="size-4" />
          </Button>
      </PromptInputActions>
    </PromptInput>
  )
}
