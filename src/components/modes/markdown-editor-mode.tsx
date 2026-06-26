import { useEffect, useState } from "react"

import { Textarea } from "@/components/ui/textarea"

import type { FileItem } from "@/components/chat/full-chat-app"

const DEFAULT_MARKDOWN = `# Draft

## Facts
- 

## Analysis
- 

## Next step
- 
`

function makeFileMarkdown(file: FileItem | null) {
  if (!file) return DEFAULT_MARKDOWN

  return `# ${file.name}

## Facts
- Review source file

## Analysis
- Draft findings here

## Next step
- Add next legal action
`
}

export function MarkdownEditorMode({ activeFile }: { activeFile: FileItem | null }) {
  const [value, setValue] = useState(makeFileMarkdown(activeFile))

  useEffect(() => {
    setValue(makeFileMarkdown(activeFile))
  }, [activeFile])

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          {activeFile ? activeFile.name : "Untitled draft"}
        </p>
      </div>
      <div className="flex min-h-0 flex-1">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-0 flex-1 resize-none rounded-none border-0 px-4 py-4 text-sm leading-6 shadow-none focus-visible:ring-0"
          placeholder="Write markdown..."
        />
      </div>
    </section>
  )
}
