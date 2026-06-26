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

export function createDocumentFromFile(file: { name: string } | null) {
  if (!file) return DEFAULT_DOCUMENT

  return `${file.name.replace(/\.[^.]+$/, "")}

Matter
Working legal draft

Facts
1. Review the selected source file.
2. Extract the controlling facts.
3. Record the dates, parties, and deadlines.

Analysis
Summarize the operative legal effect of the selected document and identify any ambiguity that requires follow-up review.

Next Step
Draft the next filing, notice, or client-facing explanation.
`
}

export function createViewerDocument(file: { name: string; ext?: string } | null) {
  if (!file) return ""

  const kind = file.ext?.toLowerCase()

  if (kind === "pdf") {
    return `Filed Document

Document
${file.name}

Summary
This PDF is loaded in review mode. The current workspace is set up to inspect the document structure, key sections, and draft related output without altering the source file.

Review Notes
1. Confirm title page and clause numbering.
2. Check notice language, dates, and service method.
3. Draft follow-up text in a separate working document when needed.
`
  }

  if (kind === "docx") {
    return `Word Document

Document
${file.name}

Summary
This Word-style document is shown in viewer mode first, with editing available in the working draft surface.

Review Notes
1. Inspect headings and paragraph flow.
2. Extract operative facts and deadlines.
3. Move into edit mode when you want to rewrite or extend the draft.
`
  }

  return createDocumentFromFile(file)
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
    suggestions.push("State the effective date in one direct sentence.")
  }

  if (!normalized.includes("notice")) {
    suggestions.push("Clarify the notice method and deadline.")
  }

  if (!normalized.includes("remedy")) {
    suggestions.push("Add one sentence on remedy if breach continues.")
  }

  if (suggestions.length < 3) {
    suggestions.push("Tighten the operative clause into shorter sentences.")
  }

  return suggestions.slice(0, 3)
}
