import JSZip from "jszip"

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function stripMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/<u>(.+?)<\/u>/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/^>\s?/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^-+\s+/gm, "")
}

function downloadBlob(fileName: string, blob: Blob) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(href), 0)
}

function createDocxDocumentXml(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").filter(Boolean)
      const firstLine = lines[0] ?? ""
      const styleId = firstLine.startsWith("### ")
        ? "Heading3"
        : firstLine.startsWith("## ")
          ? "Heading2"
          : firstLine.startsWith("# ")
            ? "Heading1"
            : null
      const text = stripMarkdown(block).trim()
      const escaped = escapeXml(text)

      if (!escaped) {
        return "<w:p/>"
      }

      return `
        <w:p>
          ${styleId ? `<w:pPr><w:pStyle w:val="${styleId}"/></w:pPr>` : ""}
          <w:r><w:t xml:space="preserve">${escaped}</w:t></w:r>
        </w:p>
      `
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
    xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:w10="urn:schemas-microsoft-com:office:word"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
    xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
    xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
    xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
    xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
    mc:Ignorable="w14 wp14">
    <w:body>
      ${paragraphs}
      <w:sectPr>
        <w:pgSz w:w="11906" w:h="16838"/>
        <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      </w:sectPr>
    </w:body>
  </w:document>`
}

const DOCX_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Baskerville" w:hAnsi="Baskerville"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="30"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
  </w:style>
</w:styles>`

function getDocumentTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "")
}

export async function exportDocumentAsDocx(fileName: string, value: string) {
  const zip = new JSZip()
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
    </Types>`
  )
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`
  )
  zip.folder("word")?.file("document.xml", createDocxDocumentXml(value))
  zip.folder("word")?.file("styles.xml", DOCX_STYLES_XML)
  zip.folder("word")?.folder("_rels")?.file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
  )

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  downloadBlob(`${getDocumentTitle(fileName)}.docx`, blob)
}

function renderHtmlBlock(block: string) {
  const trimmed = block.trim()
  const text = escapeXml(stripMarkdown(trimmed))

  if (!text) return ""
  if (trimmed.startsWith("# ")) return `<h1>${text}</h1>`
  if (trimmed.startsWith("## ")) return `<h2>${text}</h2>`
  if (trimmed.startsWith("### ")) return `<h3>${text}</h3>`
  if (trimmed.startsWith(">")) return `<blockquote>${text}</blockquote>`

  const listLines = trimmed.split("\n").filter(Boolean)
  if (listLines.every((line) => /^\d+\.\s+/.test(line))) {
    return `<ol>${listLines
      .map((line) => `<li>${escapeXml(stripMarkdown(line))}</li>`)
      .join("")}</ol>`
  }

  if (listLines.every((line) => /^-\s+/.test(line))) {
    return `<ul>${listLines
      .map((line) => `<li>${escapeXml(stripMarkdown(line))}</li>`)
      .join("")}</ul>`
  }

  return `<p>${text.replaceAll("\n", "<br/>")}</p>`
}

export function exportDocumentAsPdf(fileName: string, value: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200")
  if (!printWindow) return

  const title = escapeXml(getDocumentTitle(fileName))
  const blocks = value
    .split(/\n{2,}/)
    .map(renderHtmlBlock)
    .filter(Boolean)
    .join("")

  printWindow.document.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body {
          margin: 0;
          color: #1f160f;
          background: #ffffff;
          font-family: Baskerville, Georgia, "Times New Roman", serif;
          font-size: 12pt;
          line-height: 1.7;
        }
        main { max-width: 170mm; margin: 0 auto; }
        h1, h2, h3 { color: #291c08; page-break-after: avoid; }
        h1 { font-size: 24pt; margin: 0 0 10pt; }
        h2 { font-size: 18pt; margin: 16pt 0 8pt; }
        h3 { font-size: 15pt; margin: 14pt 0 8pt; }
        p, ul, ol, blockquote { margin: 0 0 10pt; }
        blockquote { border-left: 2pt solid #d6ab66; padding-left: 10pt; color: #5a4432; }
      </style>
    </head>
    <body>
      <main>${blocks}</main>
      <script>
        window.onload = () => {
          window.print();
        };
      </script>
    </body>
  </html>`)
  printWindow.document.close()
}
