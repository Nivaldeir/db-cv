export const SHEET_ROW_PDF_URL_KEY = "__sheetPdfUrl" as const

export const MAX_PDF_BYTES = 20 * 1024 * 1024
export const PDF_FETCH_TIMEOUT_MS = 90_000
export const PDF_FETCH_MAX_ATTEMPTS = 3
export const RETRY_BASE_DELAY_MS = 800

export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

export const CV_IMPORT_SUMMARY =
  "Registo importado automaticamente a partir da planilha Google (TATICCA Allinial Global)."
