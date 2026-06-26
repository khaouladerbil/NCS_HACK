type OutlineItem = {
  id: string
  label: string
  page: number
}

type DocumentAsset = {
  sourceUrl?: string
  editable: boolean
  pages?: string[]
  draft?: string
  outline?: OutlineItem[]
}

const DEFAULT_DOCUMENT = ""

const LEGAL_AUTOCOMPLETE = [
  "notice of termination",
  "effective date",
  "governing law",
  "material breach",
  "cure period",
  "written consent",
  "jurisdiction and venue",
  "tenant shall",
  "landlord shall",
  "failure to comply",
  "time is of the essence",
  "without prejudice",
]

const TEST_DOCUMENTS: Record<string, DocumentAsset> = {
  "Smith v Jones.pdf": {
    sourceUrl: "/test-docs/smith-v-jones.pdf",
    editable: false,
    pages: [
      `# Smith v Jones

## Case Summary

This sample PDF records dispute background, notice timing, and requested relief.

## Parties

- Plaintiff: John Smith
- Defendant: Amelia Jones
- Venue: Superior Court
`,
      `## Procedural History

1. Complaint filed.
2. Notice served.
3. Response deadline calculated.

## Relief Requested

Plaintiff seeks declaratory relief, costs, and compliance with notice requirements.
`,
      `## Review Notes

> Confirm dates, service method, and operative clause before drafting response.

## Citations

- State Code 104.B
- Lease Section 8.1
- Service Clause 12
`,
    ],
    outline: [
      { id: "case-summary", label: "Case Summary", page: 0 },
      { id: "procedural-history", label: "Procedural History", page: 1 },
      { id: "review-notes", label: "Review Notes", page: 2 },
    ],
  },
  "Plaintiff Brief.docx": {
    sourceUrl: "/test-docs/plaintiff-brief.docx",
    editable: true,
    draft: `# Plaintiff Brief

## Introduction

Plaintiff submits this brief in support of the motion for declaratory relief.

## Facts

1. Written notice was issued on May 4.
2. Cure period expired on June 3.
3. Defendant did not provide conforming response.

## Analysis

The controlling clause requires written notice, a defined cure period, and an effective date tied to delivery.

## Requested Relief

Plaintiff requests confirmation of breach, enforcement of obligations, and costs.`,
  },
  "NDA Template.docx": {
    sourceUrl: "/test-docs/nda-template.docx",
    editable: true,
    draft: `# Mutual Non-Disclosure Agreement

## Parties

This agreement is entered by and between Discloser and Recipient.

## Confidential Information

Confidential information includes materials marked confidential or reasonably understood to be confidential.

## Term

Obligations survive for three years from disclosure.

## Governing Law

This agreement is governed by the laws stated in the final signature block.`,
  },
  "Service Agreement.pdf": {
    sourceUrl: "/test-docs/service-agreement.pdf",
    editable: false,
    pages: [
      `# Service Agreement

## Scope

Vendor provides drafting, review, and filing support.
`,
      `## Fees

Fees accrue monthly and become due within fifteen days of invoice.
`,
      `## Termination

Termination requires written notice and a documented effective date.
`,
    ],
    outline: [
      { id: "scope", label: "Scope", page: 0 },
      { id: "fees", label: "Fees", page: 1 },
      { id: "termination", label: "Termination", page: 2 },
    ],
  },
}

export function createDocumentFromFile(file: { name: string } | null) {
  if (!file) return DEFAULT_DOCUMENT

  const asset = TEST_DOCUMENTS[file.name]
  if (asset?.draft) return asset.draft

  return `# ${file.name.replace(/\.[^.]+$/, "")}

## Matter

Working legal draft.

## Facts

1. Review selected source file.
2. Extract controlling facts.
3. Record dates, parties, and deadlines.

## Analysis

Summarize operative legal effect and note any ambiguity requiring follow-up.

## Next Step

Draft next filing, notice, or client-facing explanation.
`
}

export function getDocumentAsset(file: { name: string } | null) {
  if (!file) return null
  return TEST_DOCUMENTS[file.name] ?? null
}

export function createViewerDocument(file: { name: string; ext?: string } | null) {
  if (!file) return []

  const asset = getDocumentAsset(file)
  if (asset?.pages?.length) return asset.pages
  if (asset?.draft) return paginateDocument(asset.draft)

  return paginateDocument(createDocumentFromFile(file))
}

export function paginateDocument(value: string, pageSize = 2200) {
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

export function replaceDocumentPage(pages: string[], pageIndex: number, nextPageValue: string) {
  return pages
    .map((page, index) => (index === pageIndex ? nextPageValue : page))
    .join("\n\n")
}

export function getDocumentOutline(
  file: { name: string; ext?: string } | null,
  value: string
) {
  const asset = getDocumentAsset(file)
  if (asset?.outline?.length) return asset.outline

  const pages = paginateDocument(value)
  const outline: OutlineItem[] = []

  pages.forEach((page, pageIndex) => {
    page.split("\n").forEach((line, lineIndex) => {
      const match = line.match(/^#{1,3}\s+(.+)/)
      if (!match) return
      outline.push({
        id: `heading-${pageIndex}-${lineIndex}`,
        label: match[1].trim(),
        page: pageIndex,
      })
    })
  })

  if (outline.length) return outline

  return pages.map((_, page) => ({
    id: `page-${page}`,
    label: `Page ${page + 1}`,
    page,
  }))
}

export function getAutocompleteSuggestions(value: string) {
  const parts = value.trim().split(/\s+/)
  const lastWord = parts.at(-1)?.toLowerCase() ?? ""

  if (!lastWord || lastWord.length < 3) {
    return LEGAL_AUTOCOMPLETE.slice(0, 4)
  }

  return LEGAL_AUTOCOMPLETE.filter((phrase) =>
    phrase.toLowerCase().includes(lastWord)
  ).slice(0, 4)
}

export function getAiSuggestions(value: string) {
  const suggestions: string[] = []
  const normalized = value.toLowerCase()

  if (!normalized.includes("jurisdiction")) {
    suggestions.push("Add governing jurisdiction and venue.")
  }

  if (!normalized.includes("effective date")) {
    suggestions.push("State effective date in one direct sentence.")
  }

  if (!normalized.includes("notice")) {
    suggestions.push("Clarify notice method and deadline.")
  }

  if (!normalized.includes("remedy")) {
    suggestions.push("Add one sentence on remedy if breach continues.")
  }

  if (suggestions.length < 3) {
    suggestions.push("Tighten operative clause into shorter sentences.")
  }

  return suggestions.slice(0, 3)
}

export type { OutlineItem }
