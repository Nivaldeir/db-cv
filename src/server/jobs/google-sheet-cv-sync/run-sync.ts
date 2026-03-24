import { isMinioConfigured, putDocumentObject } from "@/server/storage/minio"
import { resolveGoogleSheetCsvUrlFromEnv } from "./csv-url"
import { fetchSheetRowsFromCsvUrl } from "./fetch-csv"
import { fetchPdfBufferFromUrl } from "./pdf-fetch"
import { upsertCvFromSheetRow } from "./persist-cv"
import { parseImportRow } from "./row-extract"
import { minioObjectKeyForPdfUrl } from "./storage-key"
import type { GoogleSheetCvSyncResult } from "./types"

async function downloadPdfAndMaybeUpload(pdfUrl: string): Promise<{
  storageKey: string | null
  ok: boolean
  errorMessage?: string
}> {
  try {
    const buffer = await fetchPdfBufferFromUrl(pdfUrl)
    if (!isMinioConfigured()) {
      return { storageKey: null, ok: true }
    }
    const storageKey = minioObjectKeyForPdfUrl(pdfUrl)
    await putDocumentObject(storageKey, buffer, "application/pdf")
    return { storageKey, ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { storageKey: null, ok: false, errorMessage: message }
  }
}

export async function runGoogleSheetCvSync(): Promise<GoogleSheetCvSyncResult> {
  const result: GoogleSheetCvSyncResult = {
    fetchedRows: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    pdfOk: 0,
    pdfFailed: 0,
    errors: [],
    warnings: [],
  }

  const csvUrl = resolveGoogleSheetCsvUrlFromEnv()
  if (!csvUrl) {
    result.errors.push(
      "Defina GOOGLE_SHEETS_CSV_URL ou GOOGLE_SHEETS_SPREADSHEET_ID no .env",
    )
    return result
  }

  const sheet = await fetchSheetRowsFromCsvUrl(csvUrl)
  if (!sheet.ok) {
    result.errors.push(sheet.error)
    return result
  }

  result.fetchedRows = sheet.rows.length

  for (let i = 0; i < sheet.rows.length; i++) {
    const spreadsheetLine = i + 2
    const parsed = parseImportRow(sheet.rows[i]!, spreadsheetLine)

    if (!parsed.ok) {
      result.warnings.push(parsed.warning)
      result.skipped++
      continue
    }

    const row = parsed.value
    const pdf = await downloadPdfAndMaybeUpload(row.pdfUrl)

    if (pdf.ok) {
      result.pdfOk++
    } else {
      result.pdfFailed++
      result.warnings.push(
        `${row.lineLabel} (${row.nome}): PDF não processado (download ou MinIO) — registo criado/atualizado na mesma. Causa: ${pdf.errorMessage ?? "desconhecido"}`,
      )
    }

    const action = await upsertCvFromSheetRow(row, pdf.storageKey)
    if (action === "created") result.created++
    else result.updated++
  }

  return result
}
