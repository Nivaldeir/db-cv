export function buildGoogleSheetCsvExportUrl(spreadsheetId: string, gid: string): string {
  const id = spreadsheetId.trim()
  const g = gid.trim() || "0"
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(g)}`
}

export function resolveGoogleSheetCsvUrlFromEnv(): string | null {
  const custom = process.env.GOOGLE_SHEETS_CSV_URL?.trim()
  if (custom) return custom

  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim()
  if (!id) return null

  const gid = process.env.GOOGLE_SHEETS_GID?.trim() ?? "0"
  return buildGoogleSheetCsvExportUrl(id, gid)
}
