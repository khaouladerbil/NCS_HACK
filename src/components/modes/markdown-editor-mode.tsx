import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  MessageSquareQuote,
  Minus,
  PencilLine,
  Plus,
  Underline,
} from "lucide-react"
import { gsap } from "gsap"

import { EditorDock } from "@/components/ui/editor-dock"
import { Markdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"
import {
  createViewerDocument,
  getAiSuggestions,
  getAutocompleteSuggestions,
} from "@/lib/document"

import type { FileItem } from "@/components/chat/full-chat-app"

type MarkdownEditorModeProps = {
  activeFile: FileItem | null
  value: string
  onChange: (value: string) => void
}

function getSelectionState(value: string, selectionStart: number, selectionEnd: number) {
  const beforeSelection = value.slice(Math.max(0, selectionStart - 4), selectionStart)
  const afterSelection = value.slice(selectionEnd, selectionEnd + 4)
  const currentLineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1
  const currentLineEnd = value.indexOf("\n", selectionStart)
  const currentLine = value.slice(
    currentLineStart,
    currentLineEnd === -1 ? value.length : currentLineEnd
  )

  return {
    bold: beforeSelection.endsWith("**") && afterSelection.startsWith("**"),
    italic:
      beforeSelection.endsWith("*") &&
      afterSelection.startsWith("*") &&
      !beforeSelection.endsWith("**"),
    underline: beforeSelection.endsWith("<u>") && afterSelection.startsWith("</u>"),
    h1: currentLine.startsWith("# "),
    h2: currentLine.startsWith("## "),
    list: currentLine.startsWith("- "),
    quote: currentLine.startsWith("> "),
  }
}

function createEditorMirror(value: string, caret: number) {
  const before = value.slice(0, caret)
  return `${before.replace(/\n$/g, "\n ")}`
}

function paginateDocument(value: string, pageSize = 2200) {
  if (!value.trim()) return [""]

  const chunks: string[] = []
  let rest = value

  while (rest.length > pageSize) {
    const splitAt = rest.lastIndexOf("\n\n", pageSize)
    const index = splitAt > pageSize * 0.45 ? splitAt : pageSize
    chunks.push(rest.slice(0, index).trim())
    rest = rest.slice(index).trimStart()
  }

  chunks.push(rest)
  return chunks
}

function replaceDocumentPage(pages: string[], pageIndex: number, nextPageValue: string) {
  return pages
    .map((page, index) => (index === pageIndex ? nextPageValue : page))
    .join("\n\n")
}

export function MarkdownEditorMode({
  activeFile,
  value,
  onChange,
}: MarkdownEditorModeProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const paperRef = useRef<HTMLElement | null>(null)
  const mirrorRef = useRef<HTMLDivElement | null>(null)
  const caretRef = useRef<HTMLSpanElement | null>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [suggestionPosition, setSuggestionPosition] = useState({ left: 28, top: 120 })
  const [surfaceMode, setSurfaceMode] = useState<"view" | "edit">("edit")
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(100)

  const ext = activeFile?.ext?.toLowerCase() ?? "md"
  const isViewerFile = ext === "pdf" || ext === "docx"
  const viewerDocument = useMemo(() => createViewerDocument(activeFile), [activeFile])
  const displayContent = surfaceMode === "view" ? viewerDocument || value : value
  const pages = useMemo(() => paginateDocument(displayContent), [displayContent])
  const safePage = Math.min(currentPage, Math.max(0, pages.length - 1))
  const currentPageValue = pages[safePage] ?? ""
  const autocomplete = useMemo(
    () => getAutocompleteSuggestions(currentPageValue),
    [currentPageValue]
  )
  const aiSuggestions = useMemo(() => getAiSuggestions(currentPageValue), [currentPageValue])
  const activeSuggestion = autocomplete[0] ?? aiSuggestions[0]
  const selectionState = useMemo(
    () => getSelectionState(currentPageValue, selection.start, selection.end),
    [currentPageValue, selection.end, selection.start]
  )

  useEffect(() => {
    if (!paperRef.current) return

    gsap.fromTo(
      paperRef.current,
      { opacity: 0, y: 18, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" }
    )
  }, [])

  useEffect(() => {
    setSurfaceMode(isViewerFile ? "view" : "edit")
  }, [isViewerFile, activeFile?.id])

  useEffect(() => {
    setCurrentPage(0)
    setSelection({ start: 0, end: 0 })
  }, [activeFile?.id, surfaceMode])

  useEffect(() => {
    if (currentPage <= pages.length - 1) return
    setCurrentPage(Math.max(0, pages.length - 1))
  }, [currentPage, pages.length])

  function syncSelection() {
    const textarea = textareaRef.current
    if (!textarea) return

    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  function updateSuggestionPosition() {
    if (!mirrorRef.current || !caretRef.current) return

    const mirrorBox = mirrorRef.current.getBoundingClientRect()
    const caretBox = caretRef.current.getBoundingClientRect()

    setSuggestionPosition({
      left: Math.max(24, caretBox.left - mirrorBox.left + 26),
      top: Math.max(96, caretBox.top - mirrorBox.top + 40),
    })
  }

  useEffect(() => {
    updateSuggestionPosition()
  }, [selection.start, value, surfaceMode])

  function focusEditor() {
    if (surfaceMode === "view") return
    textareaRef.current?.focus()
    syncSelection()
  }

  function updateCurrentPage(nextPageValue: string) {
    onChange(replaceDocumentPage(pages, safePage, nextPageValue))
  }

  function insertText(text: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextValue =
      currentPageValue.slice(0, start) + text + currentPageValue.slice(end)

    updateCurrentPage(nextValue)
    requestAnimationFrame(() => {
      textarea.focus()
      const nextCaret = start + text.length
      textarea.setSelectionRange(nextCaret, nextCaret)
      syncSelection()
      updateSuggestionPosition()
    })
  }

  function applyWrap(before: string, after = before) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = currentPageValue.slice(start, end) || "text"

    updateCurrentPage(
      currentPageValue.slice(0, start) +
        before +
        selected +
        after +
        currentPageValue.slice(end)
    )

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
      syncSelection()
      updateSuggestionPosition()
    })
  }

  function applyLinePrefix(prefix: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const lineStart = currentPageValue.lastIndexOf("\n", Math.max(0, start - 1)) + 1
    const block = currentPageValue.slice(lineStart, end || lineStart)
    const lines = (block || currentPageValue.slice(lineStart)).split("\n")

    updateCurrentPage(
      currentPageValue.slice(0, lineStart) +
        lines.map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : `${prefix}${line}`)).join("\n") +
        currentPageValue.slice(end)
    )

    requestAnimationFrame(() => {
      textarea.focus()
      syncSelection()
      updateSuggestionPosition()
    })
  }

  function applyAutocomplete() {
    if (!activeSuggestion) return

    const insertion =
      autocomplete[0] === activeSuggestion
        ? activeSuggestion
        : `${currentPageValue.trim() ? " " : ""}${activeSuggestion}`

    insertText(insertion)
  }

  const dockItems = [
    { id: "bold", label: "Bold", icon: Bold, onClick: () => applyWrap("**"), active: selectionState.bold },
    { id: "italic", label: "Italic", icon: Italic, onClick: () => applyWrap("*"), active: selectionState.italic },
    { id: "underline", label: "Underline", icon: Underline, onClick: () => applyWrap("<u>", "</u>"), active: selectionState.underline },
    { id: "h1", label: "Heading 1", icon: Heading1, onClick: () => applyLinePrefix("# "), active: selectionState.h1 },
    { id: "h2", label: "Heading 2", icon: Heading2, onClick: () => applyLinePrefix("## "), active: selectionState.h2 },
    { id: "list", label: "Bullet list", icon: List, onClick: () => applyLinePrefix("- "), active: selectionState.list },
    { id: "quote", label: "Quote", icon: MessageSquareQuote, onClick: () => applyLinePrefix("> "), active: selectionState.quote },
  ]

  const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="mb-7 text-center text-[1.8rem] font-semibold text-black">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mb-3 mt-7 text-[1.12rem] font-semibold text-black">{children}</h2>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 text-[1rem] leading-7 text-black">{children}</p>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-3 ml-6 list-decimal space-y-1 text-[1rem] leading-7 text-black">
        {children}
      </ol>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-3 ml-6 list-disc space-y-1 text-[1rem] leading-7 text-black">
        {children}
      </ul>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-5 border-l-2 border-black/20 pl-4 italic text-black/78">
        {children}
      </blockquote>
    ),
  }

  const suggestionVisible = focused && surfaceMode === "edit" && Boolean(activeSuggestion)
  const canPrev = safePage > 0
  const canNext = safePage < pages.length - 1
  const editorHeight = 760

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#fcf7ee]">
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-3 md:px-6">
        <article
          ref={paperRef}
          onClick={focusEditor}
          data-animate-panel
          className={cn(
            "legal-paper relative mx-auto min-h-[1020px] w-full max-w-[760px] overflow-hidden rounded-[18px] px-[clamp(1.1rem,4vw,3.2rem)] py-[clamp(1.3rem,4vw,2.8rem)]"
          )}
        >
          <div style={{ zoom: zoom / 100 }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate font-['Times_New_Roman',serif] text-[1.42rem] font-semibold text-black">
                  {activeFile ? activeFile.name.replace(/\.[^.]+$/, "") : "Untitled"}
                </div>
                <p className="mt-1 text-[0.68rem] tracking-[0.16em] text-black/38 uppercase">
                  {surfaceMode === "view" ? "Viewer" : "Draft"} · Page {safePage + 1} of {pages.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setZoom((value) => Math.max(80, value - 10))}
                    className="inline-flex size-8 items-center justify-center rounded-full text-black/50 transition hover:bg-black hover:text-white"
                    title="Zoom out"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-12 text-center text-[0.7rem] tracking-[0.14em] text-black/55 uppercase">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((value) => Math.min(140, value + 10))}
                    className="inline-flex size-8 items-center justify-center rounded-full text-black/50 transition hover:bg-black hover:text-white"
                    title="Zoom in"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                    disabled={!canPrev}
                    className="inline-flex size-8 items-center justify-center rounded-full text-black/50 transition enabled:hover:bg-black enabled:hover:text-white disabled:opacity-30"
                    title="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(pages.length - 1, page + 1))}
                    disabled={!canNext}
                    className="inline-flex size-8 items-center justify-center rounded-full text-black/50 transition enabled:hover:bg-black enabled:hover:text-white disabled:opacity-30"
                    title="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {isViewerFile ? (
                  <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setSurfaceMode("view")}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-full text-black/45 transition",
                        surfaceMode === "view" && "bg-black text-white"
                      )}
                      title="View"
                    >
                      <Eye className="size-4" />
                    </button>
                    {ext === "docx" ? (
                      <button
                        type="button"
                        onClick={() => setSurfaceMode("edit")}
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full text-black/45 transition",
                          surfaceMode === "edit" && "bg-black text-white"
                        )}
                        title="Edit"
                      >
                        <PencilLine className="size-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {surfaceMode === "view" ? (
              <div className="space-y-5 font-['Times_New_Roman',serif]">
                <div className="flex items-center gap-2 text-[0.72rem] tracking-[0.18em] text-black/38 uppercase">
                  <FileText className="size-3.5" />
                  Preview
                </div>
                <Markdown
                  components={markdownComponents}
                  className="min-h-[760px] text-black [&_strong]:font-semibold"
                >
                  {currentPageValue || "No document loaded."}
                </Markdown>
              </div>
            ) : (
              <div className="relative font-['Times_New_Roman',serif]">
                <div
                  ref={mirrorRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words overflow-hidden text-transparent"
                  style={{ height: `${editorHeight}px` }}
                >
                  {createEditorMirror(currentPageValue, selection.start)}
                  <span ref={caretRef}>|</span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={currentPageValue}
                  onChange={(event) => updateCurrentPage(event.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onClick={() => {
                    syncSelection()
                    updateSuggestionPosition()
                  }}
                  onKeyUp={() => {
                    syncSelection()
                    updateSuggestionPosition()
                  }}
                  onSelect={() => {
                    syncSelection()
                    updateSuggestionPosition()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Tab" && activeSuggestion) {
                      event.preventDefault()
                      applyAutocomplete()
                    }

                    if ((event.key === "Enter" || event.key === "ArrowRight") && activeSuggestion) {
                      event.preventDefault()
                      applyAutocomplete()
                    }
                  }}
                  spellCheck
                  style={{ minHeight: `${editorHeight}px`, height: `${editorHeight}px` }}
                  className="relative z-10 w-full resize-none overflow-y-auto border-0 bg-transparent font-['Times_New_Roman',serif] text-[1rem] leading-7 text-black outline-none selection:bg-black/10"
                  placeholder="Begin drafting..."
                />

                {suggestionVisible ? (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={applyAutocomplete}
                    className="absolute z-20 inline-flex max-w-[18rem] items-center gap-2 rounded-full border border-black/10 bg-black px-3 py-1.5 text-left text-[0.74rem] text-white shadow-[0_10px_24px_rgba(0,0,0,0.1)]"
                    style={{
                      left: suggestionPosition.left,
                      top: suggestionPosition.top,
                    }}
                  >
                    <span className="truncate">{activeSuggestion}</span>
                    <span className="text-[0.62rem] tracking-[0.14em] text-white/55 uppercase">
                      Tab
                    </span>
                  </button>
                ) : null}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between text-[0.68rem] tracking-[0.16em] text-black/34 uppercase">
              <span>{surfaceMode === "edit" ? "Editable page" : "Read-only page"}</span>
              <span>Page {safePage + 1}</span>
            </div>
          </div>
        </article>
      </div>

      {surfaceMode === "edit" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-[#fcf7ee] via-[#fcf7ee]/95 to-transparent px-4 pb-4 pt-8">
          <div className="pointer-events-auto flex w-full max-w-4xl justify-center">
            <EditorDock items={dockItems} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
