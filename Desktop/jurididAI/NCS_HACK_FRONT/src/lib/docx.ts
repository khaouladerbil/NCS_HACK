import JSZip from "jszip"

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

export type DocxStyleProperties = {
  fontSize?: number
  fontFamily?: string
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  alignment?: string
  spacing?: {
    before?: number
    after?: number
    line?: number
  }
}

export type DocxStyleDefinition = {
  id: string
  name: string
  basedOn?: string | null
  properties: DocxStyleProperties
}

export type DocxTextSegment = {
  id: string
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  styleId?: string
}

export type DocxParagraphContent = {
  id: string
  segments: DocxTextSegment[]
  styleId?: string
  alignment?: string
  page: number
}

export type ParsedDocxDocument = {
  paragraphs: DocxParagraphContent[]
  styles: Map<string, DocxStyleDefinition>
}

function getAttr(element: Element | null, attrName: string) {
  if (!element) return null
  return element.getAttributeNS(WORD_NS, attrName) ?? element.getAttribute(`w:${attrName}`)
}

function getChildren(element: Element, tagName: string) {
  return Array.from(element.getElementsByTagNameNS(WORD_NS, tagName))
}

function makeId(prefix: string, index: number) {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`
}

export function parseDocxStyles(stylesXml: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(stylesXml, "text/xml")
  const stylesMap = new Map<string, DocxStyleDefinition>()
  const styleElements = Array.from(doc.getElementsByTagNameNS(WORD_NS, "style"))

  styleElements.forEach((style) => {
    const styleId = getAttr(style, "styleId")
    if (!styleId) return

    const nameElement = getChildren(style, "name")[0]
    const basedOnElement = getChildren(style, "basedOn")[0]
    const rPr = getChildren(style, "rPr")[0]
    const pPr = getChildren(style, "pPr")[0]

    const styleDef: DocxStyleDefinition = {
      id: styleId,
      name: getAttr(nameElement, "val") ?? styleId,
      basedOn: getAttr(basedOnElement, "val"),
      properties: {},
    }

    if (rPr) {
      styleDef.properties.bold = getChildren(rPr, "b").length > 0
      styleDef.properties.italic = getChildren(rPr, "i").length > 0
      styleDef.properties.underline = getChildren(rPr, "u").length > 0

      const size = getAttr(getChildren(rPr, "sz")[0], "val")
      if (size) styleDef.properties.fontSize = Number(size) / 2

      const fontFamily = getAttr(getChildren(rPr, "rFonts")[0], "ascii")
      if (fontFamily) styleDef.properties.fontFamily = fontFamily

      const color = getAttr(getChildren(rPr, "color")[0], "val")
      if (color) styleDef.properties.color = `#${color}`
    }

    if (pPr) {
      const alignment = getAttr(getChildren(pPr, "jc")[0], "val")
      if (alignment) styleDef.properties.alignment = alignment

      const spacing = getChildren(pPr, "spacing")[0]
      if (spacing) {
        styleDef.properties.spacing = {
          before: Number(getAttr(spacing, "before") ?? 0),
          after: Number(getAttr(spacing, "after") ?? 0),
          line: Number(getAttr(spacing, "line") ?? 0),
        }
      }
    }

    stylesMap.set(styleId, styleDef)
  })

  return stylesMap
}

export function getDocxComputedStyle(
  styles: Map<string, DocxStyleDefinition>,
  styleId?: string
): DocxStyleProperties {
  if (!styleId) return {}

  const style = styles.get(styleId)
  if (!style) return {}

  const inherited = style.basedOn ? getDocxComputedStyle(styles, style.basedOn) : {}
  return { ...inherited, ...style.properties }
}

export function getDocxHeadingLevel(
  styles: Map<string, DocxStyleDefinition>,
  styleId?: string
) {
  if (!styleId) return 0
  const name = styles.get(styleId)?.name.toLowerCase() ?? ""
  if (name.includes("heading 1")) return 1
  if (name.includes("heading 2")) return 2
  if (name.includes("heading 3")) return 3
  return 0
}

export function serializeDocxParagraphs(
  paragraphs: DocxParagraphContent[],
  styles: Map<string, DocxStyleDefinition>
) {
  return paragraphs
    .map((paragraph) => {
      const text = paragraph.segments.map((segment) => segment.text).join("")
      const headingLevel = getDocxHeadingLevel(styles, paragraph.styleId)
      if (!text.trim()) return ""
      if (headingLevel > 0) return `${"#".repeat(headingLevel)} ${text.trim()}`
      return text
    })
    .join("\n\n")
}

export async function parseDocxFile(buffer: ArrayBuffer): Promise<ParsedDocxDocument> {
  const zip = await JSZip.loadAsync(buffer)
  const documentXml = await zip.file("word/document.xml")?.async("string")
  const stylesXml = (await zip.file("word/styles.xml")?.async("string")) ?? ""

  if (!documentXml) throw new Error("DOCX missing word/document.xml")

  const parser = new DOMParser()
  const doc = parser.parseFromString(documentXml, "text/xml")
  const styles = parseDocxStyles(stylesXml)
  const body = doc.getElementsByTagNameNS(WORD_NS, "body")[0]

  if (!body) return { paragraphs: [], styles }

  let currentPage = 1
  let paragraphIndex = 0
  let segmentIndex = 0

  const paragraphs = Array.from(body.children)
    .filter((node) => node.localName === "p")
    .map((paragraph) => {
      const pageBreaks = Array.from(paragraph.getElementsByTagNameNS(WORD_NS, "br"))
      const hasPageBreak = pageBreaks.some((pageBreak) => getAttr(pageBreak, "type") === "page")
      if (hasPageBreak) currentPage += 1

      const pPr = getChildren(paragraph, "pPr")[0]
      const styleId = getAttr(getChildren(pPr, "pStyle")[0], "val") ?? undefined
      const alignment = getAttr(getChildren(pPr, "jc")[0], "val") ?? undefined
      const runs = Array.from(paragraph.getElementsByTagNameNS(WORD_NS, "r"))

      const segments = runs.reduce<DocxTextSegment[]>((accumulator, run) => {
          const parts = [
            ...Array.from(run.getElementsByTagNameNS(WORD_NS, "t")).map((node) => node.textContent ?? ""),
            ...Array.from(run.getElementsByTagNameNS(WORD_NS, "tab")).map(() => "\t"),
          ]
          const text = parts.join("")
          if (!text && run.getElementsByTagNameNS(WORD_NS, "br").length === 0) return accumulator

          const rPr = getChildren(run, "rPr")[0]
          accumulator.push({
            id: makeId("segment", segmentIndex++),
            text,
            bold: getChildren(run, "b").length > 0 || getChildren(rPr ?? run, "b").length > 0,
            italic: getChildren(run, "i").length > 0 || getChildren(rPr ?? run, "i").length > 0,
            underline: getChildren(run, "u").length > 0 || getChildren(rPr ?? run, "u").length > 0,
            strike: getChildren(run, "strike").length > 0 || getChildren(rPr ?? run, "strike").length > 0,
            styleId: getAttr(getChildren(rPr ?? run, "rStyle")[0], "val") ?? undefined,
          })
          return accumulator
        }, [])

      return {
        id: makeId("paragraph", paragraphIndex++),
        segments: segments.length
          ? segments
          : [
              {
                id: makeId("segment", segmentIndex++),
                text: "",
                bold: false,
                italic: false,
                underline: false,
                strike: false,
              },
            ],
        styleId,
        alignment,
        page: currentPage,
      } satisfies DocxParagraphContent
    })

  return { paragraphs, styles }
}
