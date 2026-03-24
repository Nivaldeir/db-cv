export type GoogleSheetCvSyncResult = {
  fetchedRows: number
  created: number
  updated: number
  skipped: number
  pdfOk: number
  pdfFailed: number
  errors: string[]
  warnings: string[]
}

export type SheetRow = Record<string, string>

export type ParsedImportRow = {
  nome: string
  emailNorm: string
  phoneNorm: string
  pdfUrl: string
  submittedAt: Date
  lineLabel: string
}
