import { useRef, useState } from "react"
import { marked } from "marked"
import { toast } from "@heroui/react"
import { Download, Loader2, Sparkles } from "lucide-react"

import {
  type Editor,
  EditorBubbleMenu,
  EditorCharacterCount,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTable,
  EditorNodeTaskList,
  EditorNodeText,
  EditorProvider,
  EditorSelector,
  EditorTableColumnAfter,
  EditorTableColumnBefore,
  EditorTableColumnDelete,
  EditorTableColumnMenu,
  EditorTableDelete,
  EditorTableFix,
  EditorTableGlobalMenu,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableMenu,
  EditorTableMergeCells,
  EditorTableRowAfter,
  EditorTableRowBefore,
  EditorTableRowDelete,
  EditorTableRowMenu,
  EditorTableSplitCell,
} from "@/components/kibo-ui/editor"
import { generateLegalText } from "@/lib/backend"

type KiboEditorModeProps = {
  value: string
  onChange: (value: string) => void
}

function toHtml(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  // Déjà du HTML ?
  if (trimmed.startsWith("<")) return trimmed
  try {
    return marked.parse(trimmed, { async: false }) as string
  } catch {
    return `<p>${trimmed}</p>`
  }
}

function downloadBlob(fileName: string, blob: Blob) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(href), 0)
}

function exportHtmlAsDoc(html: string) {
  const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8"><title>Document</title></head>
  <body style="font-family: Baskerville, Georgia, serif; font-size: 12pt; line-height: 1.6;">${html}</body></html>`
  downloadBlob("document.doc", new Blob([doc], { type: "application/msword" }))
}

function exportHtmlAsPdf(html: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200")
  if (!win) return
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Document</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { color:#1f160f; background:#fff; font-family: Baskerville, Georgia, "Times New Roman", serif; font-size:12pt; line-height:1.7; }
    main { max-width:170mm; margin:0 auto; }
    h1,h2,h3 { color:#291c08; page-break-after:avoid; }
    h1{font-size:24pt;margin:0 0 10pt} h2{font-size:18pt;margin:16pt 0 8pt} h3{font-size:15pt;margin:14pt 0 8pt}
    p,ul,ol,blockquote{margin:0 0 10pt} blockquote{border-left:2pt solid #d6ab66;padding-left:10pt;color:#5a4432}
    table{border-collapse:collapse} td,th{border:1px solid #999;padding:4pt 8pt}
  </style></head>
  <body><main>${html}</main><script>window.onload=()=>window.print()</script></body></html>`)
  win.document.close()
}

export function KiboEditorMode({ value, onChange }: KiboEditorModeProps) {
  const [docKey, setDocKey] = useState(0)
  const [initialContent, setInitialContent] = useState(() => toHtml(value))
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const htmlRef = useRef(initialContent)

  const handleUpdate = ({ editor }: { editor: Editor }) => {
    const html = editor.getHTML()
    htmlRef.current = html
    onChange(html)
  }

  async function handleGenerate() {
    const trimmed = aiPrompt.trim()
    if (!trimmed || aiGenerating) return
    setAiGenerating(true)
    try {
      const content = await generateLegalText(trimmed)
      const html = toHtml(content)
      setInitialContent(html)
      htmlRef.current = html
      onChange(html)
      setDocKey((k) => k + 1) // remonte l'éditeur avec le nouveau contenu
      setAiPrompt("")
      toast("Document généré — vous pouvez le modifier")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Génération impossible")
    } finally {
      setAiGenerating(false)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(214,171,102,0.12),transparent_22%),linear-gradient(180deg,#f8f3ea_0%,#efe6d6_100%)]">
      {/* Barre IA + export */}
      <div className="shrink-0 px-3 pt-3 md:px-5">
        <div className="mx-auto flex w-full max-w-[860px] items-center gap-2 rounded-2xl border border-[#e0d3bf] bg-white/80 px-3 py-2 shadow-[0_10px_28px_rgba(71,46,22,0.08)] backdrop-blur">
          <Sparkles className="size-4 shrink-0 text-[#b1842f]" />
          <input
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void handleGenerate()
              }
            }}
            disabled={aiGenerating}
            placeholder="Décrivez le document juridique à générer…"
            className="min-w-0 flex-1 bg-transparent text-[0.86rem] text-[#22170f] outline-none placeholder:text-[#9c8a76]"
          />
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={aiGenerating || !aiPrompt.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#291c08] px-3.5 py-1.5 text-[0.72rem] font-semibold text-white transition hover:bg-[#1d1406] disabled:opacity-50"
          >
            {aiGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {aiGenerating ? "Génération…" : "Générer"}
          </button>
        </div>
      </div>

      {/* Éditeur riche */}
      <div className="flex flex-1 justify-center overflow-y-auto px-3 pb-10 pt-4 md:px-5">
        <div className="w-full max-w-[860px]">
          <div className="legal-paper legal-grain rounded-[30px] border border-[#e5d9c9] bg-white shadow-[0_26px_80px_rgba(71,46,22,0.12)]">
            <EditorProvider
              key={docKey}
              className="prose prose-sm max-w-none min-h-[60vh] px-12 py-10 text-[#1f160f] focus:outline-none [&_.ProseMirror]:min-h-[55vh] [&_.ProseMirror]:outline-none"
              content={initialContent}
              onUpdate={handleUpdate}
              placeholder="Commencez à rédiger, ou générez un document avec l'IA ci-dessus…"
            >
              <EditorFloatingMenu>
                <EditorNodeHeading1 hideName />
                <EditorNodeBulletList hideName />
                <EditorNodeQuote hideName />
                <EditorNodeCode hideName />
                <EditorNodeTable hideName />
              </EditorFloatingMenu>
              <EditorBubbleMenu>
                <EditorSelector title="Texte">
                  <EditorNodeText />
                  <EditorNodeHeading1 />
                  <EditorNodeHeading2 />
                  <EditorNodeHeading3 />
                  <EditorNodeBulletList />
                  <EditorNodeOrderedList />
                  <EditorNodeTaskList />
                  <EditorNodeQuote />
                  <EditorNodeCode />
                </EditorSelector>
                <EditorSelector title="Format">
                  <EditorFormatBold />
                  <EditorFormatItalic />
                  <EditorFormatUnderline />
                  <EditorFormatStrike />
                  <EditorFormatCode />
                  <EditorFormatSuperscript />
                  <EditorFormatSubscript />
                </EditorSelector>
                <EditorLinkSelector />
                <EditorClearFormatting />
              </EditorBubbleMenu>
              <EditorTableMenu>
                <EditorTableColumnMenu>
                  <EditorTableColumnBefore />
                  <EditorTableColumnAfter />
                  <EditorTableColumnDelete />
                </EditorTableColumnMenu>
                <EditorTableRowMenu>
                  <EditorTableRowBefore />
                  <EditorTableRowAfter />
                  <EditorTableRowDelete />
                </EditorTableRowMenu>
                <EditorTableGlobalMenu>
                  <EditorTableHeaderColumnToggle />
                  <EditorTableHeaderRowToggle />
                  <EditorTableDelete />
                  <EditorTableMergeCells />
                  <EditorTableSplitCell />
                  <EditorTableFix />
                </EditorTableGlobalMenu>
              </EditorTableMenu>
              <div className="px-12 pb-6 text-[0.7rem] text-[#9c8a76]">
                <EditorCharacterCount.Words>Mots : </EditorCharacterCount.Words>
              </div>
            </EditorProvider>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="shrink-0 flex items-center justify-center gap-2 px-3 pb-4 pt-1 md:px-5">
        <button
          type="button"
          onClick={() => exportHtmlAsDoc(htmlRef.current)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dcccb7] bg-white/88 px-4 py-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-[#6d5640] transition hover:bg-[#f4ecdf] hover:text-[#24170d]"
        >
          <Download className="size-3.5" /> Export DOCX
        </button>
        <button
          type="button"
          onClick={() => exportHtmlAsPdf(htmlRef.current)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dcccb7] bg-white/88 px-4 py-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-[#6d5640] transition hover:bg-[#f4ecdf] hover:text-[#24170d]"
        >
          <Download className="size-3.5" /> Export PDF
        </button>
      </div>
    </section>
  )
}
