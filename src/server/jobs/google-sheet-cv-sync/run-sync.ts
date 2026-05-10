import { GeminiCvExtractionError } from "@/server/gemini/extract-cv-from-pdf"
import { extractCvFromPdf } from "@/server/ai/extract-cv"
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

function logSync(
  level: "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>,
) {
  const payload = context ? ` ${JSON.stringify(context)}` : ""
  const line = `[sync-google-sheet] ${message}${payload}`
  if (level === "warn") {
    console.warn(line)
    return
  }
  if (level === "error") {
    console.error(line)
    return
  }
  console.log(line)
}

function normalizeErrorForLog(err: unknown): Record<string, unknown> {
  if (err instanceof GeminiCvExtractionError) {
    const cause = err.cause
    if (cause instanceof Error) {
      return {
        type: err.name,
        message: err.message,
        causeName: cause.name,
        causeMessage: cause.message,
        causeStack: cause.stack?.split("\n").slice(0, 6).join("\n"),
      }
    }
    if (cause && typeof cause === "object") {
      const c = cause as Record<string, unknown>
      return {
        type: err.name,
        message: err.message,
        causeMessage:
          (typeof c.message === "string" && c.message) ||
          (typeof c.error === "string" && c.error) ||
          null,
        causeStatus:
          (typeof c.status === "number" && c.status) ||
          (typeof c.code === "number" && c.code) ||
          null,
        causeCode: typeof c.code === "string" ? c.code : null,
        cause: c,
      }
    }
    return { type: err.name, message: err.message, cause }
  }

  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 6).join("\n"),
    }
  }

  return { type: typeof err, value: String(err) }
}

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
  logSync("info", "Iniciando sincronização de CVs")
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
    const message =
      "Defina GOOGLE_SHEETS_CSV_URL ou GOOGLE_SHEETS_SPREADSHEET_ID no .env"
    result.errors.push(message)
    logSync("error", message)
    return result
  }

  for (const source of csvSources) {
    logSync("info", "Lendo aba/fonte", { source: source.label, csvUrl: source.csvUrl })
    const sheet = await fetchSheetRowsFromCsvUrl(source.csvUrl, source.label)
    if (!sheet.ok) {
      const message = `${source.label}: ${sheet.error}`
      result.errors.push(message)
      logSync("error", "Falha ao carregar planilha CSV", {
        source: source.label,
        error: sheet.error,
      })
      continue
    }

    logSync("info", "Linhas carregadas da planilha", {
      source: source.label,
      totalRows: sheet.rows.length,
    })
    result.fetchedRows += sheet.rows.length

    for (let i = 0; i < sheet.rows.length; i++) {
      const spreadsheetLine = i + 2
      const parsed = parseImportRow(sheet.rows[i]!, spreadsheetLine, source.label)

      if (!parsed.ok) {
        result.warnings.push(parsed.warning)
        logSync("warn", "Linha ignorada", {
          source: source.label,
          line: spreadsheetLine,
          warning: parsed.warning,
        })
        result.skipped++
        continue
      }

      const row = parsed.value
      logSync("info", "Processando linha", {
        source: source.label,
        line: spreadsheetLine,
        lineLabel: row.lineLabel,
        nome: row.nome,
        email: row.emailNorm,
      })
      const pdf = await downloadPdfAndMaybeUpload(row.pdfUrl)

      if (pdf.ok) {
        result.pdfOk++
        logSync("info", "PDF processado com sucesso", {
          lineLabel: row.lineLabel,
          nome: row.nome,
          uploadedToMinio: Boolean(pdf.storageKey),
          storageKey: pdf.storageKey,
        })
      } else {
        result.pdfFailed++
        const warning = `${row.lineLabel} (${row.nome}): PDF não processado (download ou MinIO) — registo criado/atualizado na mesma. Causa: ${pdf.errorMessage ?? "desconhecido"}`
        result.warnings.push(warning)
        logSync("warn", "PDF não processado", {
          lineLabel: row.lineLabel,
          nome: row.nome,
          error: pdf.errorMessage ?? "desconhecido",
        })
      }

      let geminiFields: CvGeminiMergeFields | null = null
      let geminiExtraction: CvExtractionResult | null = null
      let aiSeen = false
      const hasAiKey =
        Boolean(process.env.GEMINI_API_KEY?.trim()) ||
        Boolean(process.env.GROQ_API_KEY?.trim())
      if (pdf.ok && pdf.buffer && hasAiKey) {
        try {
          const { result: extraction, provider } = await extractCvFromPdf(
            pdf.buffer,
          )
          geminiExtraction = extraction
          aiSeen = true
          logSync("info", "Extração IA concluída", {
            lineLabel: row.lineLabel,
            nome: row.nome,
            provider,
          })
          console.log(
            `[sync-google-sheet] IA(${provider}) ${row.lineLabel} (${row.nome}) — JSON do modelo:\n`,
            JSON.stringify(extraction, null, 2),
          )
          geminiFields = mapGeminiExtractionToCvFields(extraction)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          const warning = `${row.lineLabel} (${row.nome}): extração IA falhou — registo usa só dados da planilha. ${msg}`
          result.warnings.push(warning)
          logSync("warn", "Extração IA falhou", {
            lineLabel: row.lineLabel,
            nome: row.nome,
            error: msg,
            details: normalizeErrorForLog(e),
          })
        }
      } else if (!hasAiKey) {
        logSync("info", "Extração IA desativada (sem GEMINI_API_KEY/GROQ_API_KEY)", {
          lineLabel: row.lineLabel,
          nome: row.nome,
        })
      }

      const { action, cvId } = await upsertCvFromSheetRow(
        row,
        pdf.storageKey,
        geminiFields,
        aiSeen,
      )
      if (action === "created") result.created++
      else result.updated++
      logSync("info", "Registo persistido", {
        lineLabel: row.lineLabel,
        nome: row.nome,
        action,
        cvId,
      })

      if (geminiExtraction) {
        try {
          await upsertCvExtractionFromGemini(cvId, geminiExtraction)
          logSync("info", "Extração estruturada persistida", {
            lineLabel: row.lineLabel,
            nome: row.nome,
            cvId,
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          const warning = `${row.lineLabel} (${row.nome}): falha ao gravar extração estruturada (cv_extractions). ${msg}`
          result.warnings.push(warning)
          logSync("warn", "Falha ao persistir extração estruturada", {
            lineLabel: row.lineLabel,
            nome: row.nome,
            cvId,
            error: msg,
          })
        }
      }
    }
  }

  logSync("info", "Sincronização finalizada", {
    fetchedRows: result.fetchedRows,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    pdfOk: result.pdfOk,
    pdfFailed: result.pdfFailed,
    errors: result.errors.length,
    warnings: result.warnings.length,
  })
  return result
}
