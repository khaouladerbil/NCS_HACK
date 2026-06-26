import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Bold,
  Code2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageSquareQuote,
  Strikethrough,
  Underline,
} from "lucide-react"

import { Markdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"
import {
  getDocxComputedStyle,
  parseDocxFile,
  serializeDocxParagraphs,
  type DocxParagraphContent,
  type DocxStyleDefinition,
  type DocxStyleProperties,
} from "@/lib/docx"
import {
  createViewerDocument,
  getAiSuggestions,
  getAutocompleteSuggestions,
  getDocumentAsset,
  paginateDocument,
  replaceDocumentPage,
} from "@/lib/document"

import type { FileItem } from "@/components/chat/full-chat-app"

type MarkdownEditorModeProps = {
  activeFile: FileItem | null
  value: string
  onChange: (value: string) => void
  onToolbarStateChange?: (state: EditorToolbarState | null) => void
}

export type EditorToolbarAction =
  | "zoom-out"
  | "zoom-in"
  | "view"
  | "edit"
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "link"
  | "list"
  | "ordered"
  | "quote"
  | "divider"

export type EditorToolbarButton = {
  id: EditorToolbarAction
  label: string
  icon: ElementType
  active?: boolean
}

export type EditorToolbarState = {
  zoom: number
  sourceUrl?: string
  surfaceMode: "view" | "edit"
  isViewerFile: boolean
  canEdit: boolean
  leftButtons: EditorToolbarButton[]
  rightButtons: EditorToolbarButton[]
}

const PAGE_HEIGHT = 1020
const PAGE_WIDTH = 760

function mergeDocxStyles(...styles: DocxStyleProperties[]) {
  return styles.reduce<DocxStyleProperties>(
    (accumulator, style) => ({
      ...accumulator,
      ...style,
      spacing: {
        ...accumulator.spacing,
        ...style.spacing,
      },
    }),
    {}
  )
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
    strike: beforeSelection.endsWith("~~") && afterSelection.startsWith("~~"),
    h1: currentLine.startsWith("# "),
    h2: currentLine.startsWith("## "),
    h3: currentLine.startsWith("### "),
    list: currentLine.startsWith("- "),
    ordered: /^\d+\.\s/.test(currentLine),
    quote: currentLine.startsWith("> "),
  }
}

function getGhostSuggestion(value: string, suggestion: string | undefined) {
  if (!suggestion) return ""

  const trailing = value.match(/([A-Za-z]+)$/)?.[1] ?? ""
  if (!trailing) return suggestion

  const lowerTrailing = trailing.toLowerCase()
  const lowerSuggestion = suggestion.toLowerCase()

  if (lowerSuggestion.startsWith(lowerTrailing)) {
    return suggestion.slice(trailing.length)
  }

  return suggestion
}

export function MarkdownEditorMode({
  activeFile,
  value,
  onChange,
  onToolbarStateChange,
}: MarkdownEditorModeProps) {
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [activePage, setActivePage] = useState(0)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [focused, setFocused] = useState(false)
  const [surfaceMode, setSurfaceMode] = useState<"view" | "edit">("edit")
  const [zoom, setZoom] = useState(100)
  const [autocompletePulse, setAutocompletePulse] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [docxContent, setDocxContent] = useState<DocxParagraphContent[]>([])
  const [docxStyles, setDocxStyles] = useState<Map<string, DocxStyleDefinition>>(new Map())
  const [docxLoading, setDocxLoading] = useState(false)
  const [docxError, setDocxError] = useState<string | null>(null)

  const ext = activeFile?.ext?.toLowerCase() ?? "md"
  const isDocx = ext === "docx"
  const asset = useMemo(() => getDocumentAsset(activeFile), [activeFile])
  const isPdf = ext === "pdf"
  const isViewerFile = ext === "pdf" || ext === "docx"
  const editable = !isPdf && surfaceMode === "edit"
  const viewerPages = useMemo(() => createViewerDocument(activeFile), [activeFile])
  const pages = useMemo(
    () => (editable ? paginateDocument(value) : viewerPages),
    [editable, value, viewerPages]
  )
  const safePage = Math.min(activePage, Math.max(0, pages.length - 1))
  const activePageValue = pages[safePage] ?? ""
  const autocomplete = useMemo(
    () => getAutocompleteSuggestions(activePageValue),
    [activePageValue]
  )
  const aiSuggestions = useMemo(() => getAiSuggestions(activePageValue), [activePageValue])
  const activeSuggestion = autocomplete[0] ?? aiSuggestions[0]
  const ghostSuggestion = getGhostSuggestion(activePageValue, activeSuggestion)
  const selectionState = useMemo(
    () => getSelectionState(activePageValue, selection.start, selection.end),
    [activePageValue, selection.end, selection.start]
  )
  const scale = zoom / 100
  const docxPages = useMemo(() => {
    const groups = new Map<number, DocxParagraphContent[]>()
    docxContent.forEach((paragraph) => {
      const page = paragraph.page || 1
      const existing = groups.get(page) ?? []
      existing.push(paragraph)
      groups.set(page, existing)
    })
    return Array.from(groups.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([page, paragraphs]) => ({ page, paragraphs }))
  }, [docxContent])
  const visibleDocxPages = docxPages.length ? docxPages : [{ page: 1, paragraphs: [] }]

  useEffect(() => {
    setSurfaceMode(isPdf ? "view" : "edit")
    setActivePage(0)
    setSelection({ start: 0, end: 0 })
  }, [activeFile?.id, isPdf])

  useEffect(() => {
    const sourceUrl = asset?.sourceUrl

    if (!isDocx || !sourceUrl) {
      setDocxContent([])
      setDocxStyles(new Map())
      setDocxError(null)
      setDocxLoading(false)
      return
    }

    let disposed = false

    const load = async () => {
      setDocxLoading(true)
      setDocxError(null)

      try {
        const response = await fetch(sourceUrl)
        if (!response.ok) {
          throw new Error(`Failed to load DOCX: ${response.status}`)
        }

        const parsed = await parseDocxFile(await response.arrayBuffer())
        if (disposed) return

        setDocxStyles(parsed.styles)
        setDocxContent(parsed.paragraphs)
        onChange(serializeDocxParagraphs(parsed.paragraphs, parsed.styles))
      } catch (error) {
        if (disposed) return
        setDocxError(error instanceof Error ? error.message : "Failed to parse DOCX")
      } finally {
        if (!disposed) setDocxLoading(false)
      }
    }

    void load()

    return () => {
      disposed = true
    }
  }, [asset?.sourceUrl, isDocx, onChange])

  useEffect(() => {
    const handleJump = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: number }>).detail
      const page = detail?.page ?? 0
      setActivePage(page)
      pageRefs.current[page]?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    window.addEventListener("editor:jump", handleJump as EventListener)
    return () => window.removeEventListener("editor:jump", handleJump as EventListener)
  }, [])

  function syncSelection(pageIndex: number) {
    const textarea = textareaRefs.current[pageIndex]
    if (!textarea) return

    setActivePage(pageIndex)
    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  function updatePage(pageIndex: number, nextPageValue: string) {
    onChange(replaceDocumentPage(pages, pageIndex, nextPageValue))
  }

  function applyWrap(before: string, after = before) {
    const textarea = textareaRefs.current[safePage]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = activePageValue.slice(start, end) || "text"
    const nextValue =
      activePageValue.slice(0, start) +
      before +
      selected +
      after +
      activePageValue.slice(end)

    updatePage(safePage, nextValue)
    setAutocompletePulse(true)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
      syncSelection(safePage)
    })
  }

  useEffect(() => {
    if (!autocompletePulse) return

    const timeout = window.setTimeout(() => setAutocompletePulse(false), 260)
    return () => window.clearTimeout(timeout)
  }, [autocompletePulse])

  useEffect(() => {
    if (!isTyping) return

    const timeout = window.setTimeout(() => setIsTyping(false), 180)
    return () => window.clearTimeout(timeout)
  }, [isTyping])

  function applyLinePrefix(prefix: string) {
    const textarea = textareaRefs.current[safePage]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const lineStart = activePageValue.lastIndexOf("\n", Math.max(0, start - 1)) + 1
    const block = activePageValue.slice(lineStart, end || lineStart)
    const lines = (block || activePageValue.slice(lineStart)).split("\n")
    const nextValue =
      activePageValue.slice(0, lineStart) +
      lines
        .map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : `${prefix}${line}`))
        .join("\n") +
      activePageValue.slice(end)

    updatePage(safePage, nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      syncSelection(safePage)
    })
  }

  function applyHeading(prefix: string) {
    const textarea = textareaRefs.current[safePage]
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = activePageValue.lastIndexOf("\n", Math.max(0, start - 1)) + 1
    const lineEnd = activePageValue.indexOf("\n", start)
    const endIndex = lineEnd === -1 ? activePageValue.length : lineEnd
    const currentLine = activePageValue.slice(lineStart, endIndex)
    const stripped = currentLine.replace(/^#{1,6}\s+/, "")
    const nextValue =
      activePageValue.slice(0, lineStart) +
      `${prefix}${stripped}` +
      activePageValue.slice(endIndex)

    updatePage(safePage, nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      syncSelection(safePage)
    })
  }

  function applyLink() {
    const textarea = textareaRefs.current[safePage]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = activePageValue.slice(start, end) || "link text"
    const nextValue =
      activePageValue.slice(0, start) +
      `[${selected}](https://)` +
      activePageValue.slice(end)

    updatePage(safePage, nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, start + 1 + selected.length)
      syncSelection(safePage)
    })
  }

  function insertDivider() {
    const textarea = textareaRefs.current[safePage]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const divider = `${start > 0 ? "\n" : ""}---\n`
    const nextValue = activePageValue.slice(0, start) + divider + activePageValue.slice(end)

    updatePage(safePage, nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const nextCaret = start + divider.length
      textarea.setSelectionRange(nextCaret, nextCaret)
      syncSelection(safePage)
    })
  }

  function applyAutocomplete() {
    const textarea = textareaRefs.current[safePage]
    if (!textarea || !activeSuggestion) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const insertion =
      autocomplete[0] === activeSuggestion
        ? activeSuggestion
        : `${activePageValue.trim() ? " " : ""}${activeSuggestion}`

    const nextValue =
      activePageValue.slice(0, start) + insertion + activePageValue.slice(end)

    updatePage(safePage, nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const nextCaret = start + insertion.length
      textarea.setSelectionRange(nextCaret, nextCaret)
      syncSelection(safePage)
    })
  }

  const leftButtons: EditorToolbarButton[] = useMemo(
    () =>
      isDocx
        ? []
        : [
            { id: "h1", label: "Heading 1", icon: Heading1, active: selectionState.h1 },
            { id: "h2", label: "Heading 2", icon: Heading2, active: selectionState.h2 },
            { id: "h3", label: "Heading 3", icon: Heading3, active: selectionState.h3 },
            { id: "bold", label: "Bold", icon: Bold, active: selectionState.bold },
            { id: "italic", label: "Italic", icon: Italic, active: selectionState.italic },
            { id: "underline", label: "Underline", icon: Underline, active: selectionState.underline },
          ],
    [isDocx, selectionState.bold, selectionState.h1, selectionState.h2, selectionState.h3, selectionState.italic, selectionState.underline]
  )

  const rightButtons: EditorToolbarButton[] = useMemo(
    () =>
      isDocx
        ? []
        : [
            { id: "strike", label: "Strikethrough", icon: Strikethrough, active: selectionState.strike },
            { id: "code", label: "Inline code", icon: Code2 },
            { id: "link", label: "Link", icon: Link2 },
            { id: "list", label: "Bullet list", icon: List, active: selectionState.list },
            { id: "ordered", label: "Numbered list", icon: ListOrdered, active: selectionState.ordered },
            { id: "quote", label: "Quote", icon: MessageSquareQuote, active: selectionState.quote },
            { id: "divider", label: "Divider", icon: FileText },
          ],
    [isDocx, selectionState.list, selectionState.ordered, selectionState.quote, selectionState.strike]
  )

  useEffect(() => {
    onToolbarStateChange?.({
      zoom,
      sourceUrl: asset?.sourceUrl,
      surfaceMode,
      isViewerFile,
      canEdit: !isPdf,
      leftButtons,
      rightButtons,
    })
  }, [
    asset?.sourceUrl,
    isPdf,
    isViewerFile,
    leftButtons,
    onToolbarStateChange,
    rightButtons,
    surfaceMode,
    zoom,
  ])

  useEffect(() => () => onToolbarStateChange?.(null), [onToolbarStateChange])

  const handleToolbarAction = useEffectEvent((event: Event) => {
    const action = (event as CustomEvent<{ action?: EditorToolbarAction }>).detail?.action
    if (!action) return

    if (action === "zoom-out") {
      setZoom((value) => Math.max(70, value - 10))
      return
    }
    if (action === "zoom-in") {
      setZoom((value) => Math.min(150, value + 10))
      return
    }
    if (action === "view") {
      setSurfaceMode("view")
      return
    }
    if (action === "edit" && !isPdf) {
      setSurfaceMode("edit")
      return
    }
    if (isDocx) return
    if (!editable) return

    if (action === "h1") applyHeading("# ")
    if (action === "h2") applyHeading("## ")
    if (action === "h3") applyHeading("### ")
    if (action === "bold") applyWrap("**")
    if (action === "italic") applyWrap("*")
    if (action === "underline") applyWrap("<u>", "</u>")
    if (action === "strike") applyWrap("~~")
    if (action === "code") applyWrap("`")
    if (action === "link") applyLink()
    if (action === "list") applyLinePrefix("- ")
    if (action === "ordered") applyLinePrefix("1. ")
    if (action === "quote") applyLinePrefix("> ")
    if (action === "divider") insertDivider()
  })

  useEffect(() => {
    window.addEventListener("editor:toolbar-action", handleToolbarAction as EventListener)
    return () =>
      window.removeEventListener("editor:toolbar-action", handleToolbarAction as EventListener)
  }, [])

  function updateDocxSegment(paragraphId: string, segmentId: string, nextText: string) {
    setDocxContent((current) => {
      const next = current.map((paragraph) =>
        paragraph.id === paragraphId
          ? {
              ...paragraph,
              segments: paragraph.segments.map((segment) =>
                segment.id === segmentId ? { ...segment, text: nextText } : segment
              ),
            }
          : paragraph
      )

      onChange(serializeDocxParagraphs(next, docxStyles))
      return next
    })
  }

  function renderDocxParagraph(paragraph: DocxParagraphContent) {
    const paragraphStyle = mergeDocxStyles(
      getDocxComputedStyle(docxStyles, paragraph.styleId),
      paragraph.alignment ? { alignment: paragraph.alignment } : {}
    )

    return (
      <div
        key={paragraph.id}
        className="min-h-[1.5em] rounded px-1 py-0.5 transition-colors hover:bg-black/[0.025]"
        style={{
          marginTop: paragraphStyle.spacing?.before
            ? `${paragraphStyle.spacing.before / 20}pt`
            : undefined,
          marginBottom: paragraphStyle.spacing?.after
            ? `${paragraphStyle.spacing.after / 20}pt`
            : "0.42rem",
          lineHeight: paragraphStyle.spacing?.line
            ? `${paragraphStyle.spacing.line / 240}`
            : undefined,
          textAlign: paragraphStyle.alignment as
            | "left"
            | "center"
            | "right"
            | "justify"
            | undefined,
        }}
      >
        {paragraph.segments.map((segment) => {
          const segmentStyle = mergeDocxStyles(
            paragraphStyle,
            getDocxComputedStyle(docxStyles, segment.styleId)
          )

          return (
            <span
              key={segment.id}
              contentEditable={editable}
              suppressContentEditableWarning
              onInput={(event) => {
                updateDocxSegment(paragraph.id, segment.id, event.currentTarget.textContent ?? "")
              }}
              className={cn(
                "rounded-[3px] px-[1px] outline-none transition-colors",
                editable && "focus:bg-[#eef2f7] focus-visible:bg-[#eef2f7]"
              )}
              style={{
                fontFamily: segmentStyle.fontFamily ?? "Times New Roman",
                fontSize: segmentStyle.fontSize ? `${segmentStyle.fontSize}pt` : "12pt",
                fontWeight:
                  segment.bold || segmentStyle.bold ? "700" : "400",
                fontStyle:
                  segment.italic || segmentStyle.italic ? "italic" : "normal",
                textDecoration:
                  [
                    segment.underline || segmentStyle.underline ? "underline" : "",
                    segment.strike ? "line-through" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined,
                color: segmentStyle.color ?? "#111111",
              }}
            >
              {segment.text || (editable ? "\u200b" : "")}
            </span>
          )
        })}
      </div>
    )
  }

  const markdownComponents = {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="mb-7 text-center text-[1.8rem] font-semibold text-black">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="mb-3 mt-7 text-[1.12rem] font-semibold text-black">{children}</h2>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-3 text-[1rem] leading-7 text-black">{children}</p>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="mb-3 ml-6 list-decimal space-y-1 text-[1rem] leading-7 text-black">
        {children}
      </ol>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-3 ml-6 list-disc space-y-1 text-[1rem] leading-7 text-black">
        {children}
      </ul>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="my-5 border-l-2 border-black/20 pl-4 italic text-black/78">
        {children}
      </blockquote>
    ),
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f4f5f7]">
      <div className="flex flex-1 justify-center overflow-y-auto px-4 pb-32 pt-6 md:px-6">
        <div className="flex w-full max-w-[1120px] flex-col items-center space-y-6">
          {isDocx
            ? visibleDocxPages.map(({ page, paragraphs }, pageIndex) => (
                <div
                  key={`${activeFile?.id ?? "blank"}-docx-${pageIndex}`}
                  ref={(node) => {
                    pageRefs.current[pageIndex] = node
                  }}
                  className="relative mx-auto flex w-full justify-center"
                  style={{
                    width: `${PAGE_WIDTH * scale}px`,
                    height: `${PAGE_HEIGHT * scale}px`,
                  }}
                >
                  <article
                    className="absolute left-1/2 top-0 overflow-hidden rounded-[18px] bg-white shadow-[0_20px_56px_rgba(15,23,42,0.08)]"
                    style={{
                      width: `${PAGE_WIDTH * scale}px`,
                      minHeight: `${PAGE_HEIGHT * scale}px`,
                      transform: "translateX(-50%)",
                      transformOrigin: "top center",
                    }}
                    onClick={() => setActivePage(pageIndex)}
                  >
                    <div
                      className="origin-top h-full w-full px-[3.2rem] py-[2.8rem] font-['Times_New_Roman',serif]"
                      style={{
                        transform: `scale(${scale})`,
                        width: `${PAGE_WIDTH}px`,
                        minHeight: `${PAGE_HEIGHT}px`,
                      }}
                    >
                      <div className="mb-5 flex items-center justify-between text-[0.68rem] tracking-[0.16em] text-black/38 uppercase">
                        <span>{activeFile?.name?.replace(/\.[^.]+$/, "") ?? "Untitled Draft"}</span>
                        <span>Page {page}</span>
                      </div>
                      {docxLoading ? (
                        <div className="pt-8 text-center text-[0.92rem] text-black/55">
                          Loading DOCX...
                        </div>
                      ) : docxError ? (
                        <div className="pt-8 text-center text-[0.92rem] text-[#9f2d20]">
                          {docxError}
                        </div>
                      ) : (
                        <div className="min-h-[820px] space-y-0.5">
                          {paragraphs.map((paragraph) => renderDocxParagraph(paragraph))}
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              ))
            : pages.map((page, pageIndex) => (
                <div
                  key={`${activeFile?.id ?? "blank"}-${pageIndex}`}
                  ref={(node) => {
                    pageRefs.current[pageIndex] = node
                  }}
                  className="relative mx-auto flex w-full justify-center"
                  style={{
                    width: `${PAGE_WIDTH * scale}px`,
                    height: `${PAGE_HEIGHT * scale}px`,
                  }}
                >
                  <article
                    className="absolute left-1/2 top-0 overflow-hidden rounded-[18px] bg-white shadow-[0_20px_56px_rgba(15,23,42,0.08)]"
                    style={{
                      width: `${PAGE_WIDTH * scale}px`,
                      minHeight: `${PAGE_HEIGHT * scale}px`,
                      transform: "translateX(-50%)",
                      transformOrigin: "top center",
                    }}
                    onClick={() => {
                      setActivePage(pageIndex)
                      textareaRefs.current[pageIndex]?.focus()
                    }}
                  >
                    <div
                      className="origin-top h-full w-full px-[3.2rem] py-[2.8rem]"
                      style={{
                        transform: `scale(${scale})`,
                        width: `${PAGE_WIDTH}px`,
                        minHeight: `${PAGE_HEIGHT}px`,
                      }}
                    >
                      <div className="mb-5 flex items-center justify-between text-[0.68rem] tracking-[0.16em] text-black/38 uppercase">
                        <span>{activeFile?.name?.replace(/\.[^.]+$/, "") ?? "Untitled Draft"}</span>
                        <span>Page {pageIndex + 1}</span>
                      </div>

                      {editable ? (
                        <div
                          className={cn(
                            "relative rounded-lg font-['Times_New_Roman',serif] transition-shadow duration-200",
                            autocompletePulse && "shadow-[0_0_0_3px_rgba(15,118,110,0.16)]"
                          )}
                        >
                          <textarea
                            ref={(node) => {
                              textareaRefs.current[pageIndex] = node
                            }}
                            value={page}
                            onChange={(event) => {
                              setIsTyping(true)
                              setAutocompletePulse(true)
                              updatePage(pageIndex, event.target.value)
                            }}
                            onFocus={() => {
                              setFocused(true)
                              setActivePage(pageIndex)
                            }}
                            onBlur={() => setFocused(false)}
                            onClick={() => syncSelection(pageIndex)}
                            onKeyUp={() => syncSelection(pageIndex)}
                            onSelect={() => syncSelection(pageIndex)}
                            onKeyDown={(event) => {
                              setActivePage(pageIndex)
                              if (
                                (event.key === "Tab" || event.key === "ArrowRight") &&
                                activeSuggestion
                              ) {
                                event.preventDefault()
                                applyAutocomplete()
                              }
                            }}
                            spellCheck
                            style={{
                              minHeight: `${PAGE_HEIGHT - 160}px`,
                              height: `${PAGE_HEIGHT - 160}px`,
                            }}
                            className="relative z-10 w-full resize-none overflow-y-auto border-0 bg-transparent font-['Times_New_Roman',serif] text-[1rem] leading-7 text-black outline-none selection:bg-black/10"
                            placeholder="Begin drafting..."
                          />

                          <AnimatePresence>
                            {focused && activePage === pageIndex && ghostSuggestion && !isTyping ? (
                              <motion.div
                                key={`${pageIndex}-${ghostSuggestion}`}
                                className="pointer-events-none absolute bottom-3 right-3 z-20"
                                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.16, ease: "easeOut" }}
                              >
                                <div className="rounded-full border border-[#cfe4dd] bg-white/96 px-3 py-1 text-[0.68rem] font-medium tracking-[0.02em] text-[#0f766e] shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                                  {ghostSuggestion}
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="font-['Times_New_Roman',serif]">
                          <Markdown
                            components={markdownComponents}
                            className="min-h-[820px] text-black [&_strong]:font-semibold"
                          >
                            {page || "No document loaded."}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
