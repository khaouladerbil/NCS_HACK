import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { ArrowUp, Mic, Paperclip, Square } from "lucide-react"

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
  onSubmit: () => void
  className?: string
  textareaClassName?: string
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
  resultIndex: number
  results: ArrayLike<{
    0: {
      transcript: string
    }
  }>
}

export function ChatComposer({
  draft,
  loading,
  onDraftChange,
  onSubmit,
  className,
  textareaClassName,
}: ChatComposerProps) {
  const [listening, setListening] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const draftRef = useRef(draft)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

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
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new speechApi()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript?.trim()

      if (!transcript) {
        return
      }

      onDraftChange(
        draftRef.current ? `${draftRef.current} ${transcript}`.trim() : transcript
      )
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? [])

    if (!file) {
      return
    }

    const attachment = `[Attached: ${file.name}]`
    onDraftChange(
      draftRef.current ? `${draftRef.current}\n${attachment}` : attachment
    )
    event.target.value = ""
  }

  return (
    <PromptInput
      value={draft}
      onValueChange={onDraftChange}
      onSubmit={onSubmit}
      isLoading={loading}
      className={className ?? "rounded-3xl border-border bg-background/96 p-3 shadow-lg shadow-black/5 backdrop-blur"}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <PromptInputTextarea
        placeholder="Issue, deadline, output."
        className={
          textareaClassName ??
          "min-h-16 text-sm leading-6 text-foreground placeholder:text-muted-foreground"
        }
      />
      <PromptInputActions className="mt-2 justify-between">
        <div className="flex items-center gap-1">
          <PromptInputAction tooltip="Upload file">
            <span
              role="button"
              tabIndex={0}
              className="inline-flex size-8 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  openFilePicker()
                }
              }}
            >
              <Paperclip className="size-4" />
            </span>
          </PromptInputAction>
          <PromptInputAction tooltip={listening ? "Stop voice" : "Voice input"}>
            <span
              role="button"
              tabIndex={0}
              aria-pressed={listening}
              data-active={listening}
              className="inline-flex size-8 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
              onClick={toggleVoice}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  toggleVoice()
                }
              }}
            >
              {listening ? (
                <Square className="size-3.5 fill-current" />
              ) : (
                <Mic className="size-4" />
              )}
            </span>
          </PromptInputAction>
        </div>
        <Button
          className="rounded-full"
          size="icon-sm"
          onClick={onSubmit}
          disabled={loading}
        >
          <ArrowUp className="size-4" />
        </Button>
      </PromptInputActions>
    </PromptInput>
  )
}
