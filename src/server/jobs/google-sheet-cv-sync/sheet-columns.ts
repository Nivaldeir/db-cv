import { normalizeSheetHeaderText } from "./normalize-header"

const PDF_HEADER_PRIORITY: readonly string[] = [
  "url cv",
  "url do cv",
  "link cv",
  "cv url",
  "url curriculo",
  "url currículo",
  "link do cv",
]

export function resolveCvPdfColumnIndex(headers: string[]): number {
  const env = process.env.GOOGLE_SHEETS_CV_URL_COLUMN_INDEX?.trim()
  if (env) {
    const oneBased = Number.parseInt(env, 10)
    if (Number.isFinite(oneBased) && oneBased >= 1) {
      return oneBased - 1
    }
  }

  const normalized = headers.map((h) => normalizeSheetHeaderText(h ?? ""))

  for (const want of PDF_HEADER_PRIORITY) {
    const i = normalized.indexOf(want)
    if (i >= 0) return i
  }

  const fuzzy = normalized.findIndex(
    (h) => h.includes("cv") && (h.includes("url") || h.includes("link")),
  )
  if (fuzzy >= 0) return fuzzy

  return -1
}

export function resolveCvPdfColumnIndexForSource(
  headers: string[],
  sourceLabel?: string,
): number {
  const byHeader = resolveCvPdfColumnIndex(headers)
  if (byHeader >= 0 && byHeader < headers.length) return byHeader

  const source = (sourceLabel ?? "").toLowerCase()
  if (source.includes("estudantes")) {
    // Aba estudantes: A Nome, B Email, C Telefone, D Data, E URL CV
    return 4
  }

  // Aba profissionais experientes: A..H, URL em H
  if (headers.length >= 8) return 7

  // Fallback final: última coluna disponível.
  return Math.max(0, headers.length - 1)
}
