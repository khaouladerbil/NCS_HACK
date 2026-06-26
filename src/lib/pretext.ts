import {
  layout,
  layoutWithLines,
  measureNaturalWidth,
  prepare,
  prepareWithSegments,
} from "@chenglou/pretext"

type PretextOptions = {
  letterSpacing?: number
  whiteSpace?: "normal" | "pre-wrap"
}

type PretextMeasurement = {
  height: number
  lineCount: number
}

const DEFAULT_OPTIONS: Required<PretextOptions> = {
  letterSpacing: 0,
  whiteSpace: "pre-wrap",
}

export function measurePretextBlock(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options?: PretextOptions
): PretextMeasurement {
  if (maxWidth <= 0) {
    return { height: lineHeight, lineCount: 1 }
  }

  const resolved = { ...DEFAULT_OPTIONS, ...options }
  const prepared = prepare(text || " ", font, resolved)
  const result = layout(prepared, maxWidth, lineHeight)
  const lineCount = Math.max(1, result.lineCount)

  return {
    height: Math.max(lineHeight, lineCount * lineHeight),
    lineCount,
  }
}

export function layoutPretextLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options?: PretextOptions
) {
  if (maxWidth <= 0) {
    return {
      height: lineHeight,
      lineCount: 1,
      lines: [{ text: text || "", width: 0, start: { segmentIndex: 0, graphemeIndex: 0 }, end: { segmentIndex: 0, graphemeIndex: 0 } }],
    }
  }

  const resolved = { ...DEFAULT_OPTIONS, ...options }
  return layoutWithLines(prepareWithSegments(text || " ", font, resolved), maxWidth, lineHeight)
}

export function measurePretextNaturalWidth(
  text: string,
  font: string,
  options?: PretextOptions
) {
  const resolved = { ...DEFAULT_OPTIONS, ...options }
  return measureNaturalWidth(prepareWithSegments(text || " ", font, resolved))
}
