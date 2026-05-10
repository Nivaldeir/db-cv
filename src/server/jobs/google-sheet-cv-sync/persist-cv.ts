import { db } from "@/server/db"
import { CV_IMPORT_SUMMARY } from "./constants"
import type { CvGeminiMergeFields } from "./map-gemini-extraction-to-cv"
import type { ParsedImportRow } from "./types"

const DEFAULT_IMPORT_FIELDS = {
  jobTitle: "—",
  experience: "—",
  location: "—",
  skills: "[]",
  status: "novo",
} as const

function buildCvCreateData(
  row: ParsedImportRow,
  storageKey: string | null,
  gemini: CvGeminiMergeFields | null,
  aiSeen: boolean,
) {
  const g = gemini ?? {}
  const phone =
    (g.phone?.trim() || row.phoneNorm.trim() || "—")
  return {
    name: (g.name?.trim() || row.nome.trim() || "—"),
    email: row.emailNorm,
    phone,
    jobTitle: (g.jobTitle?.trim() || DEFAULT_IMPORT_FIELDS.jobTitle),
    experience: (g.experience?.trim() || DEFAULT_IMPORT_FIELDS.experience),
    location: (g.location?.trim() || DEFAULT_IMPORT_FIELDS.location),
    skills: g.skills ?? DEFAULT_IMPORT_FIELDS.skills,
    status: DEFAULT_IMPORT_FIELDS.status,
    submittedAt: row.submittedAt,
    cvUrl: row.pdfUrl,
    sourceSheet: row.sourceSheet,
    storageKey,
    summary: (g.summary?.trim() || CV_IMPORT_SUMMARY),
    aiSeen,
  }
}

export type UpsertCvFromSheetRowResult = {
  action: "created" | "updated"
  cvId: string
}

export async function upsertCvFromSheetRow(
  row: ParsedImportRow,
  storageKey: string | null,
  gemini: CvGeminiMergeFields | null = null,
  aiSeen: boolean = false,
): Promise<UpsertCvFromSheetRowResult> {
  const payload = buildCvCreateData(row, storageKey, gemini, aiSeen)

  const exactMatch = await db.cv.findFirst({
    where: { email: row.emailNorm, cvUrl: row.pdfUrl },
  })
  if (exactMatch) {
    const g = gemini
    await db.cv.update({
      where: { id: exactMatch.id },
      data: {
        name: payload.name,
        phone: payload.phone,
        submittedAt: payload.submittedAt,
        sourceSheet: payload.sourceSheet,
        storageKey: storageKey ?? exactMatch.storageKey,
        summary:
          g == null
            ? payload.summary
            : g.summary != null
              ? payload.summary
              : exactMatch.summary,
        ...(g != null && g.jobTitle != null
          ? { jobTitle: payload.jobTitle }
          : {}),
        ...(g != null && g.experience != null
          ? { experience: payload.experience }
          : {}),
        ...(g != null && g.location != null
          ? { location: payload.location }
          : {}),
        ...(g != null && g.skills != null ? { skills: payload.skills } : {}),
        ...(aiSeen ? { aiSeen: true } : {}),
      },
    })
    return { action: "updated", cvId: exactMatch.id }
  }

  const samePdf = await db.cv.findFirst({
    where: { cvUrl: row.pdfUrl },
  })

  if (samePdf && samePdf.email !== row.emailNorm) {
    const created = await db.cv.create({ data: payload })
    return { action: "created", cvId: created.id }
  }

  if (samePdf) {
    const g = gemini
    await db.cv.update({
      where: { id: samePdf.id },
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        submittedAt: payload.submittedAt,
        sourceSheet: payload.sourceSheet,
        storageKey: storageKey ?? samePdf.storageKey,
        summary:
          g == null
            ? payload.summary
            : g.summary != null
              ? payload.summary
              : samePdf.summary,
        ...(g != null && g.jobTitle != null
          ? { jobTitle: payload.jobTitle }
          : {}),
        ...(g != null && g.experience != null
          ? { experience: payload.experience }
          : {}),
        ...(g != null && g.location != null
          ? { location: payload.location }
          : {}),
        ...(g != null && g.skills != null ? { skills: payload.skills } : {}),
        ...(aiSeen ? { aiSeen: true } : {}),
      },
    })
    return { action: "updated", cvId: samePdf.id }
  }

  const created = await db.cv.create({ data: payload })
  return { action: "created", cvId: created.id }
}
