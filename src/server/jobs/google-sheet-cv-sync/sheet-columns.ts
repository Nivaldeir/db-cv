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

  return 3
}
