import { renderToBuffer } from "@react-pdf/renderer"
import { mapCvToDto } from "@/server/lib/prisma-mappers"
import { db } from "@/server/db"
import {
  buildCvPdfFilename,
  CvPdfDocument,
} from "@/server/pdf/cv-pdf-document"
import {
  getDocumentObjectBuffer,
  isMinioConfigured,
} from "@/server/storage/minio"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const row = await db.cv.findUnique({ where: { id } })
  if (!row) {
    return new Response("CV não encontrado", { status: 404 })
  }

  const storageKey = row.storageKey?.trim()
  if (storageKey && isMinioConfigured()) {
    try {
      const buffer = await getDocumentObjectBuffer(storageKey)
      const cv = mapCvToDto(row)
      const filename = buildCvPdfFilename(cv)

      return new Response(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, no-store, max-age=0",
          Pragma: "no-cache",
        },
      })
    } catch {
      /* PDF sintético abaixo */
    }
  }

  const cv = mapCvToDto(row)
  const buffer = await renderToBuffer(<CvPdfDocument cv={cv} />)
  const filename = buildCvPdfFilename(cv)

  return new Response(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  })
}
