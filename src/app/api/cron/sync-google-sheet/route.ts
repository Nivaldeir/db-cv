import { runGoogleSheetCvSync } from "@/server/jobs/google-sheet-cv-sync"

export const runtime = "nodejs"
export const maxDuration = 300

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return process.env.NODE_ENV !== "production"
  }
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return new Response("Unauthorized", { status: 401 })
  }
  try {
    const result = await runGoogleSheetCvSync()
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
