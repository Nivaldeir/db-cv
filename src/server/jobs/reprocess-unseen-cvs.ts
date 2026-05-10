import { db } from "@/server/db"
import { extractCvFromPdf } from "@/server/ai/extract-cv"
import { mapGeminiExtractionToCvFields } from "@/server/jobs/google-sheet-cv-sync/map-gemini-extraction-to-cv"
import { upsertCvExtractionFromGemini } from "@/server/jobs/google-sheet-cv-sync/persist-cv-extraction"

export type ReprocessUnseenCvsResult = {
  scanned: number
  marked: number
  failed: number
  errors: string[]
}

function log(message: string, context?: Record<string, unknown>) {
  const payload = context ? ` ${JSON.stringify(context)}` : ""
  console.log(`[reprocess-unseen-cvs] ${message}${payload}`)
}

async function downloadPdf(cvUrl: string): Promise<Buffer> {
  const res = await fetch(cvUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar PDF`)
  return Buffer.from(await res.arrayBuffer())
}

export async function reprocessUnseenCvs(): Promise<ReprocessUnseenCvsResult> {
  const result: ReprocessUnseenCvsResult = {
    scanned: 0,
    marked: 0,
    failed: 0,
    errors: [],
  }

  const pendingCvs = await db.cv.findMany({
    where: { aiSeen: false },
    select: { id: true, name: true, cvUrl: true },
  })
  result.scanned = pendingCvs.length
  log("Iniciando reprocessamento de CVs não vistos pela IA", {
    pendentes: pendingCvs.length,
  })

  for (const cv of pendingCvs) {
    try {
      const buffer = await downloadPdf(cv.cvUrl)
      const { result: extraction, provider } = await extractCvFromPdf(buffer)
      const fields = mapGeminiExtractionToCvFields(extraction)

      await db.cv.update({
        where: { id: cv.id },
        data: {
          aiSeen: true,
          ...(fields.name ? { name: fields.name } : {}),
          ...(fields.phone ? { phone: fields.phone } : {}),
          ...(fields.jobTitle ? { jobTitle: fields.jobTitle } : {}),
          ...(fields.experience ? { experience: fields.experience } : {}),
          ...(fields.location ? { location: fields.location } : {}),
          ...(fields.skills ? { skills: fields.skills } : {}),
          ...(fields.summary ? { summary: fields.summary } : {}),
        },
      })
      await upsertCvExtractionFromGemini(cv.id, extraction)
      result.marked++
      log("CV marcado como visto pela IA", {
        cvId: cv.id,
        nome: cv.name,
        provider,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      result.failed++
      result.errors.push(`${cv.name} (${cv.id}): ${msg}`)
      log("Falha ao reprocessar CV", { cvId: cv.id, nome: cv.name, error: msg })
    }
  }

  log("Reprocessamento finalizado", result)
  return result
}
