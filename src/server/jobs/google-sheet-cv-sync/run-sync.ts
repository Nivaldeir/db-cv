import { extractCvFromPdfWithGemini } from "@/server/gemini/extract-cv-from-pdf"
import type { CvExtractionResult } from "@/server/gemini/cv-extraction-schema"
import { isMinioConfigured, putDocumentObject } from "@/server/storage/minio"
import { resolveGoogleSheetCsvSourcesFromEnv } from "./csv-url"
import { fetchSheetRowsFromCsvUrl } from "./fetch-csv"
import { fetchPdfBufferFromUrl } from "./pdf-fetch"
import {
  mapGeminiExtractionToCvFields,
  type CvGeminiMergeFields,
} from "./map-gemini-extraction-to-cv"
import { upsertCvExtractionFromGemini } from "./persist-cv-extraction"
import { upsertCvFromSheetRow } from "./persist-cv"
import { parseImportRow } from "./row-extract"
import { minioObjectKeyForPdfUrl } from "./storage-key"
import type { GoogleSheetCvSyncResult } from "./types"

async function downloadPdfAndMaybeUpload(pdfUrl: string): Promise<{
  storageKey: string | null
  ok: boolean
  buffer?: Buffer
  errorMessage?: string
}> {
  try {
    const buffer = await fetchPdfBufferFromUrl(pdfUrl)
    if (!isMinioConfigured()) {
      return { storageKey: null, ok: true, buffer }
    }
    const storageKey = minioObjectKeyForPdfUrl(pdfUrl)
    await putDocumentObject(storageKey, buffer, "application/pdf")
    return { storageKey, ok: true, buffer }
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

  const csvSources = resolveGoogleSheetCsvSourcesFromEnv()
  if (csvSources.length === 0) {
    result.errors.push(
      "Defina GOOGLE_SHEETS_CSV_URL ou GOOGLE_SHEETS_SPREADSHEET_ID no .env",
    )
    return result
  }

  for (const source of csvSources) {
    const sheet = await fetchSheetRowsFromCsvUrl(source.csvUrl, source.label)
    if (!sheet.ok) {
      result.errors.push(`${source.label}: ${sheet.error}`)
      continue
    }

    result.fetchedRows += sheet.rows.length

    for (let i = 0; i < sheet.rows.length; i++) {
      const spreadsheetLine = i + 2
      const parsed = parseImportRow(sheet.rows[i]!, spreadsheetLine, source.label)

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

      let geminiFields: CvGeminiMergeFields | null = null
      let geminiExtraction: CvExtractionResult | null = null
      if (pdf.ok && pdf.buffer && process.env.GEMINI_API_KEY?.trim()) {
        try {
          const extraction = await extractCvFromPdfWithGemini(pdf.buffer)
          geminiExtraction = extraction
          console.log(
            `[sync] Gemini ${row.lineLabel} (${row.nome}) — JSON do modelo:\n`,
            JSON.stringify(extraction, null, 2),
          )
          geminiFields = mapGeminiExtractionToCvFields(extraction)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          result.warnings.push(
            `${row.lineLabel} (${row.nome}): extração Gemini falhou — registo usa só dados da planilha. ${msg}`,
          )
        }
      }

      const { action, cvId } = await upsertCvFromSheetRow(
        row,
        pdf.storageKey,
        geminiFields,
      )
      if (action === "created") result.created++
      else result.updated++

      if (geminiExtraction) {
        try {
          await upsertCvExtractionFromGemini(cvId, geminiExtraction)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          result.warnings.push(
            `${row.lineLabel} (${row.nome}): falha ao gravar extração estruturada (cv_extractions). ${msg}`,
          )
        }
      }
    }
  }

  return result
}
