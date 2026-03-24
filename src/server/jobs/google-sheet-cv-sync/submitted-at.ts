import { parse } from "date-fns"

const DATE_PATTERNS = [
  "dd/MM/yyyy HH:mm:ss",
  "dd/MM/yyyy HH:mm",
  "dd/MM/yyyy",
  "yyyy-MM-dd HH:mm:ss",
  "yyyy-MM-dd",
] as const

export function parseSubmittedAtFromSheet(raw: string): Date {
  const s = raw.trim()
  if (!s) return new Date()

  for (const pattern of DATE_PATTERNS) {
    try {
      const d = parse(s, pattern, new Date())
      if (!Number.isNaN(d.getTime())) return d
    } catch {
      /* next pattern */
    }
  }

  const fallback = new Date(s)
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback
}
