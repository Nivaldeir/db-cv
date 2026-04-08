import { BROWSER_USER_AGENT } from "./constants"
import { parseGoogleSheetCvCsv } from "./csv-parse"
import type { SheetRow } from "./types"

export async function fetchSheetRowsFromCsvUrl(
  csvUrl: string,
  sourceLabel?: string,
): Promise<{ ok: true; rows: SheetRow[] } | { ok: false; error: string }> {
  const res = await fetch(csvUrl, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
  })

  if (!res.ok) {
    return {
      ok: false,
      error: `Falha ao obter CSV (${res.status}). A folha tem de estar partilhada como «Qualquer pessoa com o link pode ver» ou use um URL CSV público.`,
    }
  }

  try {
    const rows = parseGoogleSheetCvCsv(await res.text(), sourceLabel)
    return { ok: true, rows }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `CSV inválido: ${message}` }
  }
}
