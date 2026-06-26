import { useEffect, useState } from "react"
import type { Components } from "react-markdown"

import { Markdown } from "@/components/ui/markdown"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { FileItem } from "@/components/chat/full-chat-app"

const DEFAULT_MARKDOWN = `# Legal Draft

## Matter
JusticePath client memorandum

## Facts
1. Insert the relevant parties and dates.
2. State the operative clause or filing issue.
3. Note the controlling jurisdiction.

## Analysis
The agreement should be read according to its express notice language, any cure-period mechanics, and any separate delivery requirements that change how notice becomes effective.

> "Written notice must be delivered no later than thirty (30) days before the intended effective date."

## Recommendations
1. Confirm the governing clause number.
2. Check whether email service is expressly permitted.
3. Prepare a notice draft with the effective date stated clearly.
`

function makeFileMarkdown(file: FileItem | null) {
  if (!file) return DEFAULT_MARKDOWN

  return `# ${file.name}

## Matter
Working legal draft

## Facts
1. Review the selected source file.
2. Extract the controlling facts.
3. Record the dates, parties, and deadlines.

## Analysis
Summarize the operative legal effect of the selected document and identify any ambiguity that requires follow-up review.

## Next Step
Draft the next filing, notice, or client-facing explanation.
`
}

const LEGAL_MARKDOWN_COMPONENTS: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="mb-12 border-b border-[#e8dece] pb-6 text-center text-[2rem] font-semibold uppercase tracking-[0.2em] text-[#5b4636]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 text-[1.04rem] font-semibold uppercase tracking-[0.18em] text-[#745b42]">
      {children}
    </h2>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-[1.02rem] leading-8 text-[#5b4838]">{children}</p>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-[1.02rem] leading-8 text-[#5b4838]">
      {children}
    </ol>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-[1.02rem] leading-8 text-[#5b4838]">
      {children}
    </ul>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 rounded-[18px] border border-[#ecd9b9] bg-white px-8 py-7 text-[1.02rem] leading-8 text-[#75604b] shadow-[inset_4px_0_0_#e8c58b]">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#463528]">{children}</strong>
  ),
}

export function MarkdownEditorMode({ activeFile }: { activeFile: FileItem | null }) {
  const [value, setValue] = useState(makeFileMarkdown(activeFile))

  useEffect(() => {
    setValue(makeFileMarkdown(activeFile))
  }, [activeFile])

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#fcf7ee]">
      <div className="mx-auto w-full max-w-[1160px] px-6 pb-14 pt-8">
        <div className="mb-6 text-center">
          <p className="text-[2rem] font-normal tracking-[-0.03em] text-[#7a6755]">
            Draft and review your legal document
          </p>
        </div>

        <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
          <div className="order-2 xl:order-1 xl:w-[320px] xl:shrink-0">
            <div className="rounded-[28px] border border-[#eadfcd] bg-[#f4eddf] p-5 shadow-[0_2px_8px_rgba(95,71,47,0.06)]">
              <div className="mb-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a7561]">
                  Markdown Source
                </p>
                <p className="mt-1 text-sm text-[#9a8572]">
                  {activeFile ? activeFile.name : "Untitled draft"}
                </p>
              </div>

              <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="min-h-[380px] resize-y rounded-[22px] border-[#e4d7c4] bg-[#fffdfa] px-4 py-4 font-mono text-[0.92rem] leading-7 text-[#5b4838] shadow-none placeholder:text-[#b09b88] focus-visible:border-[#d9c2a2] focus-visible:ring-0"
                placeholder="Write markdown..."
              />
            </div>
          </div>

          <div className="order-1 flex-1 xl:order-2">
            <div className="relative mx-auto w-full max-w-[860px]">
              <div className="legal-paper absolute inset-x-6 top-6 h-full rounded-[30px] border border-[#efe4d6] opacity-70" />
              <article
                className={cn(
                  "legal-paper relative min-h-[1120px] w-full rounded-[32px] border border-[#eadfcd] px-[clamp(1.5rem,4vw,4.5rem)] py-[clamp(2rem,5vw,4.5rem)]"
                )}
              >
                <div className="mx-auto max-w-none">
                  <Markdown
                    className="font-serif"
                    components={LEGAL_MARKDOWN_COMPONENTS}
                  >
                    {value}
                  </Markdown>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
