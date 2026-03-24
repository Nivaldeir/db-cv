import { SHEET_ROW_PDF_URL_KEY } from "./constants"
import { normalizeSheetHeaderText } from "./normalize-header"
import type { ParsedImportRow, SheetRow } from "./types"
import { parseSubmittedAtFromSheet } from "./submitted-at"

function rowToNormalizedMap(row: SheetRow): Map<string, string> {
  const map = new Map<string, string>()
  for (const [k, v] of Object.entries(row)) {
    map.set(normalizeSheetHeaderText(k), (v ?? "").trim())
  }
  return map
}

function cell(map: Map<string, string>, ...headerCandidates: string[]): string {
  for (const c of headerCandidates) {
    const v = map.get(normalizeSheetHeaderText(c))
    if (v !== undefined && v !== "") return v
  }
  return ""
}

function looksLikePdfUrl(value: string): boolean {
  const t = value.trim()
  if (!/^https?:\/\//i.test(t)) return false
  return /\.pdf(\?|$)/i.test(t) || /\.pdf/i.test(t)
}

function pdfUrlFromRow(row: SheetRow): string {
  const pinned = (row[SHEET_ROW_PDF_URL_KEY] ?? "").trim()
  if (pinned && /^https?:\/\//i.test(pinned)) {
    return pinned
  }

  const map = rowToNormalizedMap(row)
  const direct = cell(
    map,
    "URL CV",
    "Url cv",
    "URL do CV",
    "Link CV",
    "CV URL",
    "Url CV",
  )
  if (direct && /^https?:\/\//i.test(direct)) return direct

  for (const [k, v] of Object.entries(row)) {
    if (k === SHEET_ROW_PDF_URL_KEY) continue
    const t = (v ?? "").trim()
    if (looksLikePdfUrl(t)) return t
  }
  return ""
}

export type RowParseOutcome =
  | { ok: true; value: ParsedImportRow }
  | { ok: false; warning: string }

export function parseImportRow(
  row: SheetRow,
  spreadsheetLineNumber: number,
): RowParseOutcome {
  const lineLabel = `Linha ${spreadsheetLineNumber}`
  const map = rowToNormalizedMap(row)

  const pdfUrl = pdfUrlFromRow(row)
  if (!pdfUrl) {
    return {
      ok: false,
      warning: `${lineLabel}: sem URL de CV reconhecida — ignorada.`,
    }
  }

  let nome = cell(map, "Nome", "nome")
  const email = cell(map, "E-mail", "Email", "email")
  const telefone = cell(map, "Telefone", "telefone", "telemovel", "telemóvel")
  const dataRaw = cell(map, "Data", "data", "Data submissao", "Data submissão")

  if (!nome) {
    nome = email ? email.split("@")[0]! : `Candidato (${lineLabel})`
  }

  return {
    ok: true,
    value: {
      nome,
      emailNorm: email || "sem-email@importado.local",
      phoneNorm: telefone || "—",
      pdfUrl,
      submittedAt: parseSubmittedAtFromSheet(dataRaw),
      lineLabel,
    },
  }
}
