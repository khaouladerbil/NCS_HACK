import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Lenis from 'lenis'
import {
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Gavel,
  Landmark,
  MessageSquareText,
  Paperclip,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import {
  FileUpload,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit'

type Message = {
  id: string
  role: 'assistant' | 'user'
  text: string
  meta: string
}

const initialMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Bring a notice, lease clause, or court question. I will translate the process into plain steps and keep sources, dates, and next actions visible.',
    meta: 'JusticePath assistant',
  },
  {
    id: 'user-sample',
    role: 'user',
    text: 'I received a notice about an answer deadline. What should I look for first?',
    meta: '2 files ready',
  },
  {
    id: 'assistant-sample',
    role: 'assistant',
    text: 'Start with court name, case number, parties, service date, and response deadline. Then build a short evidence folder before drafting anything.',
    meta: 'Draft checklist',
  },
]

const tasks = [
  { label: 'Confirm service date', status: 'Due today', done: true },
  { label: 'Extract case number', status: 'Ready', done: true },
  { label: 'Draft answer outline', status: 'Next', done: false },
  { label: 'Find local clinic', status: 'Queued', done: false },
]

const references = [
  'Tenant answer form',
  'Fee waiver checklist',
  'Civil court timeline',
  'Legal aid locator',
]

function App() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.11 })
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }

    frame = requestAnimationFrame(raf)

    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', {
        opacity: 0,
        y: 14,
        duration: 0.42,
        stagger: 0.05,
        ease: 'power2.out',
      })
    }, shellRef)

    return () => {
      cancelAnimationFrame(frame)
      ctx.revert()
      lenis.destroy()
    }
  }, [])

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed && files.length === 0) return

    const fileSummary =
      files.length > 0 ? `Attached ${files.length} file${files.length === 1 ? '' : 's'}. ` : ''

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmed || 'Please review these documents.',
        meta: fileSummary || 'New question',
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `${fileSummary}I can turn this into a plain-language issue map, deadline list, and evidence checklist. The next useful step is identifying jurisdiction, dates, and the exact document type.`,
        meta: 'Prepared response',
      },
    ])
    setInput('')
    setFiles([])
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <main
      ref={shellRef}
      className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-espresso)]"
    >
      <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside
          data-reveal
          className="border-b border-[var(--color-paper-200)] bg-[var(--color-paper-muted)] px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-sand-200)] bg-[var(--color-sand-100)]">
              <Scale className="size-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-display text-2xl leading-none">JusticePath</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-espresso-500)]">
                AI legal guide
              </p>
            </div>
          </div>

          <nav className="mt-8 grid gap-2" aria-label="Dashboard">
            {[
              [MessageSquareText, 'Chat workspace', 'Active'],
              [FolderOpen, 'Case folder', '4 docs'],
              [Landmark, 'Court timeline', '3 steps'],
              [BookOpen, 'Resource library', 'Saved'],
            ].map(([Icon, label, meta]) => (
              <button
                key={label as string}
                className="flex min-h-11 items-center justify-between rounded-[var(--radius-md)] border border-transparent px-3 text-left text-sm transition hover:border-[var(--color-sand-200)] hover:bg-white focus-visible:outline-[var(--color-sun)]"
                type="button"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4 text-[var(--color-espresso-500)]" strokeWidth={1.5} />
                  <span>{label as string}</span>
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-espresso-300)]">
                  {meta as string}
                </span>
              </button>
            ))}
          </nav>

          <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-sand-200)] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Task manager</h2>
              <Clock3 className="size-4 text-[var(--color-espresso-500)]" strokeWidth={1.5} />
            </div>
            <div className="mt-4 grid gap-3">
              {tasks.map((task) => (
                <div key={task.label} className="flex gap-3">
                  <div
                    className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${
                      task.done
                        ? 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                        : 'border-[var(--color-paper-300)] bg-[var(--color-paper)]'
                    }`}
                  >
                    {task.done ? <CheckCircle2 className="size-3.5" strokeWidth={1.8} /> : null}
                  </div>
                  <div>
                    <p className="text-sm leading-5">{task.label}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-espresso-500)]">
                      {task.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex min-h-dvh flex-col">
          <header
            data-reveal
            className="flex flex-col gap-4 border-b border-[var(--color-paper-200)] bg-[var(--color-paper)] px-4 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-espresso-500)]">
                Civic intake dashboard
              </p>
              <h1 className="font-display text-4xl leading-tight md:text-5xl">
                Plain-language legal chat
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-paper-300)] px-4 text-sm transition hover:bg-[var(--color-paper-muted)]">
                <Search className="mr-2 inline size-4" strokeWidth={1.5} />
                Search law notes
              </button>
              <button className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-sun)] bg-[var(--color-sun)] px-4 text-sm font-semibold transition hover:bg-[var(--color-sun-200)]">
                New matter
              </button>
            </div>
          </header>

          <div className="grid flex-1 gap-6 px-4 py-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section
              data-reveal
              className="flex min-h-[640px] flex-col rounded-[var(--radius-xl)] border border-[var(--color-paper-200)] bg-white"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-paper-200)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-sun-100)]">
                    <Sparkles className="size-4 text-[var(--color-espresso)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">JusticePath assistant</h2>
                    <p className="text-sm text-[var(--color-espresso-500)]">
                      Educational guidance, not legal advice
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-[var(--color-sand-200)] bg-[var(--color-sand-100)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em]">
                  Live draft
                </span>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-sand-200)] bg-[var(--color-sand-100)]">
                        <Gavel className="size-4" strokeWidth={1.5} />
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[760px] rounded-[var(--radius-lg)] border px-4 py-3 ${
                        message.role === 'user'
                          ? 'border-[var(--color-espresso)] bg-[var(--color-espresso)] text-[var(--color-paper)]'
                          : 'border-[var(--color-paper-200)] bg-[var(--color-paper)]'
                      }`}
                    >
                      <p className="text-sm leading-6">{message.text}</p>
                      <p
                        className={`mt-2 font-mono text-[11px] uppercase tracking-[0.08em] ${
                          message.role === 'user'
                            ? 'text-[var(--color-sand-300)]'
                            : 'text-[var(--color-espresso-500)]'
                        }`}
                      >
                        {message.meta}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="border-t border-[var(--color-paper-200)] p-4">
                <FileUpload onFilesAdded={(addedFiles) => setFiles((current) => [...current, ...addedFiles])}>
                  <PromptInput>
                    {files.length > 0 ? (
                      <div className="flex flex-wrap gap-2 border-b border-[var(--color-paper-200)] px-4 py-3">
                        {files.map((file, index) => (
                          <span
                            key={`${file.name}-${index}`}
                            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-sand-200)] bg-[var(--color-sand-100)] px-3 py-1.5 text-sm"
                          >
                            <FileText className="size-4" strokeWidth={1.5} />
                            {file.name}
                            <button
                              type="button"
                              aria-label={`Remove ${file.name}`}
                              onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                            >
                              <X className="size-4" strokeWidth={1.5} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <PromptInputTextarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Ask about a notice, deadline, form, lease clause, or next step..."
                    />
                    <PromptInputActions>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          multiple
                          onChange={(event) => {
                            if (event.target.files) {
                              setFiles((current) => [...current, ...Array.from(event.target.files!)])
                            }
                          }}
                        />
                        <PromptInputAction
                          tooltip="Attach document"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="size-5 text-[var(--color-espresso-500)]" strokeWidth={1.5} />
                        </PromptInputAction>
                        <span className="hidden text-sm text-[var(--color-espresso-500)] sm:inline">
                          Shift + Enter for new line
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!input.trim() && files.length === 0}
                        className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-sun)] bg-[var(--color-sun)] px-4 text-sm font-semibold text-[var(--color-espresso)] transition hover:bg-[var(--color-sun-200)] disabled:cursor-not-allowed disabled:border-[var(--color-paper-200)] disabled:bg-[var(--color-paper-muted)] disabled:text-[var(--color-espresso-300)]"
                      >
                        Send
                        <ArrowUp className="size-4" strokeWidth={1.5} />
                      </button>
                    </PromptInputActions>
                  </PromptInput>
                </FileUpload>
              </div>
            </section>

            <aside data-reveal className="grid content-start gap-5">
              <section className="rounded-[var(--radius-xl)] border border-[var(--color-paper-200)] bg-white p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-[var(--color-success)]" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold">Guidance guardrails</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-espresso-500)]">
                  Responses stay educational, identify deadlines, and nudge users toward local legal aid when risk rises.
                </p>
              </section>

              <section className="rounded-[var(--radius-xl)] border border-[var(--color-paper-200)] bg-white p-5">
                <h2 className="text-sm font-semibold">Saved references</h2>
                <div className="mt-4 grid gap-2">
                  {references.map((reference) => (
                    <button
                      key={reference}
                      type="button"
                      className="flex min-h-11 items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-paper-200)] px-3 text-left text-sm transition hover:border-[var(--color-sand)] hover:bg-[var(--color-sand-100)]"
                    >
                      {reference}
                      <FileText className="size-4 text-[var(--color-espresso-500)]" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
