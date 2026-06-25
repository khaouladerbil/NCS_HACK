import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export type SettingsValues = {
  model: string
  systemPrompt: string
  temperature: number
}

type SettingsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: SettingsValues
  onValuesChange: (values: SettingsValues) => void
}

const MODELS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "gemini-2-pro", label: "Gemini 2 Pro" },
  { id: "llama-3-70b", label: "Llama 3 70B" },
]

export function SettingsSheet({
  open,
  onOpenChange,
  values,
  onValuesChange,
}: SettingsSheetProps) {
  const [local, setLocal] = useState<SettingsValues>(values)

  const handleSave = () => {
    onValuesChange(local)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-80 flex flex-col gap-0 p-0 bg-sidebar text-sidebar-foreground"
        showCloseButton={false}
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="size-4 text-muted-foreground" />
              <SheetTitle className="text-sm font-semibold tracking-tight">Settings</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <span className="text-base leading-none">×</span>
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-0">
            Configure model and behaviour.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-5 py-5 overflow-y-auto flex-1">
          {/* Model selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">Model</label>
            <div className="flex flex-col gap-1">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLocal({ ...local, model: m.id })}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    local.model === m.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* System prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">System Prompt</label>
            <textarea
              rows={6}
              value={local.systemPrompt}
              onChange={(e) => setLocal({ ...local, systemPrompt: e.target.value })}
              placeholder="You are a helpful legal assistant…"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground"
            />
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Temperature</label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {local.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={local.temperature}
              onChange={(e) => setLocal({ ...local, temperature: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/60">
          <Button onClick={handleSave} className="w-full rounded-xl" size="sm">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function SettingsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground rounded-lg px-3 h-9"
      onClick={onClick}
    >
      <Settings className="size-4" />
      <span className="text-xs">Settings</span>
    </Button>
  )
}
