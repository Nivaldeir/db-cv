import { db } from "@/server/db"
import { CV_IMPORT_SUMMARY } from "./constants"
import type { ParsedImportRow } from "./types"

const DEFAULT_IMPORT_FIELDS = {
  jobTitle: "—",
  experience: "—",
  location: "—",
  skills: "[]",
  status: "novo",
} as const

function buildCvCreateData(row: ParsedImportRow, storageKey: string | null) {
  return {
    name: row.nome,
    email: row.emailNorm,
    phone: row.phoneNorm,
    ...DEFAULT_IMPORT_FIELDS,
    submittedAt: row.submittedAt,
    cvUrl: row.pdfUrl,
    storageKey,
    summary: CV_IMPORT_SUMMARY,
  }
}

export async function upsertCvFromSheetRow(
  row: ParsedImportRow,
  storageKey: string | null,
): Promise<"created" | "updated"> {
  const payload = buildCvCreateData(row, storageKey)

  const exactMatch = await db.cv.findFirst({
    where: { email: row.emailNorm, cvUrl: row.pdfUrl },
  })
  if (exactMatch) {
    await db.cv.update({
      where: { id: exactMatch.id },
      data: {
        name: payload.name,
        phone: payload.phone,
        submittedAt: payload.submittedAt,
        storageKey: storageKey ?? exactMatch.storageKey,
        summary: payload.summary,
      },
    })
    return "updated"
  }

  const samePdf = await db.cv.findFirst({
    where: { cvUrl: row.pdfUrl },
  })

  if (samePdf && samePdf.email !== row.emailNorm) {
    await db.cv.create({ data: payload })
    return "created"
  }

  if (samePdf) {
    await db.cv.update({
      where: { id: samePdf.id },
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        submittedAt: payload.submittedAt,
        storageKey: storageKey ?? samePdf.storageKey,
        summary: payload.summary,
      },
    })
    return "updated"
  }

  await db.cv.create({ data: payload })
  return "created"
}
