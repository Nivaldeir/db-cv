import { parse } from "csv-parse/sync"
import { SHEET_ROW_PDF_URL_KEY } from "./constants"
import { resolveCvPdfColumnIndex } from "./sheet-columns"
import type { SheetRow } from "./types"

export function parseGoogleSheetCvCsv(csvText: string): SheetRow[] {
  const text = csvText.replace(/^\uFEFF/, "")
  const raw = parse(text, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as string[][]

  if (raw.length < 2) {
    return []
  }

  const headers = (raw[0] ?? []).map((h) => (h ?? "").trim())
  const urlCol = resolveCvPdfColumnIndex(headers)

  if (urlCol < 0 || urlCol >= headers.length) {
    throw new Error(
      `Índice da coluna do PDF (${urlCol + 1}) fora do intervalo (${headers.length} colunas). Ajuste GOOGLE_SHEETS_CV_URL_COLUMN_INDEX.`,
    )
  }

  const rows: SheetRow[] = []

  for (let r = 1; r < raw.length; r++) {
    const cells = raw[r] ?? []
    const row: SheetRow = {}

    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || `Coluna ${c + 1}`
      row[key] = (cells[c] ?? "").trim()
    }

    row[SHEET_ROW_PDF_URL_KEY] = (cells[urlCol] ?? "").trim()
    rows.push(row)
  }

  return rows
}
