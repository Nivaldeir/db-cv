export function buildGoogleSheetCsvExportUrl(spreadsheetId: string, gid: string): string {
  const id = spreadsheetId.trim()
  const g = gid.trim() || "0"
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(g)}`
}

export type GoogleSheetCsvSource = {
  label: string
  csvUrl: string
}

function parseGids(value: string): string[] {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
}

export function resolveGoogleSheetCsvSourcesFromEnv(): GoogleSheetCsvSource[] {
  const custom = process.env.GOOGLE_SHEETS_CSV_URL?.trim()
  if (custom) return [{ label: "CSV customizado", csvUrl: custom }]

  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim()
  if (!id) return []

  const experientesGid = process.env.GOOGLE_SHEETS_GID_PROFISSIONAIS_EXPERIENTES?.trim()
  const estudantesGid = process.env.GOOGLE_SHEETS_GID_ESTUDANTES_UNIVERSITARIOS?.trim()
  const hasNamedTabs = Boolean(experientesGid || estudantesGid)
  if (hasNamedTabs) {
    const out: GoogleSheetCsvSource[] = []
    if (experientesGid) {
      out.push({
        label: "Profissionais Experientes",
        csvUrl: buildGoogleSheetCsvExportUrl(id, experientesGid),
      })
    }
    if (estudantesGid) {
      out.push({
        label: "Estudantes e Universitários",
        csvUrl: buildGoogleSheetCsvExportUrl(id, estudantesGid),
      })
    }
    return out
  }

  const multiGidsRaw = process.env.GOOGLE_SHEETS_GIDS?.trim()
  if (multiGidsRaw) {
    return parseGids(multiGidsRaw).map((gid, idx) => ({
      label: `Aba ${idx + 1}`,
      csvUrl: buildGoogleSheetCsvExportUrl(id, gid),
    }))
  }

  const gid = process.env.GOOGLE_SHEETS_GID?.trim() ?? "0"
  return [{ label: "Aba principal", csvUrl: buildGoogleSheetCsvExportUrl(id, gid) }]
}

export function resolveGoogleSheetCsvUrlFromEnv(): string | null {
  return resolveGoogleSheetCsvSourcesFromEnv()[0]?.csvUrl ?? null
}
