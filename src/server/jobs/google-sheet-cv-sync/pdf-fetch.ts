import {
  BROWSER_USER_AGENT,
  MAX_PDF_BYTES,
  PDF_FETCH_MAX_ATTEMPTS,
  PDF_FETCH_TIMEOUT_MS,
  RETRY_BASE_DELAY_MS,
} from "./constants"

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function isPdfMagic(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-"
}

function httpStatusWorthRetry(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504
}

function normalizeFetchError(e: unknown): Error {
  if (e instanceof Error && e.name === "AbortError") {
    return new Error("Timeout ao descarregar o PDF")
  }
  return e instanceof Error ? e : new Error(String(e))
}

function shouldRetryAfterError(err: Error, attempt: number): boolean {
  if (attempt >= PDF_FETCH_MAX_ATTEMPTS) return false
  if (err.message === "Timeout ao descarregar o PDF") return true
  return /HTTP (429|502|503|504)\b/.test(err.message)
}

async function readPdfBody(res: Response): Promise<Buffer> {
  const len = res.headers.get("content-length")
  if (len && Number(len) > MAX_PDF_BYTES) {
    throw new Error("Ficheiro PDF demasiado grande")
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_PDF_BYTES) {
    throw new Error("Ficheiro PDF demasiado grande")
  }
  if (isPdfMagic(buf)) return buf

  const ct = (res.headers.get("content-type") ?? "").toLowerCase()
  if (ct.includes("pdf") && buf.length > 100) return buf

  throw new Error(
    `Resposta não é PDF (content-type: ${ct || "—"}, ${buf.length} bytes)`,
  )
}

export async function fetchPdfBufferFromUrl(url: string): Promise<Buffer> {
  let lastError = new Error("Falha ao descarregar PDF")

  for (let attempt = 1; attempt <= PDF_FETCH_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PDF_FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "application/pdf,application/octet-stream,*/*",
          "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
        },
      })

      if (!res.ok) {
        if (httpStatusWorthRetry(res.status) && attempt < PDF_FETCH_MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_DELAY_MS * attempt)
          continue
        }
        throw new Error(`HTTP ${res.status} ao descarregar`)
      }

      return await readPdfBody(res)
    } catch (e) {
      lastError = normalizeFetchError(e)
      if (shouldRetryAfterError(lastError, attempt)) {
        await sleep(RETRY_BASE_DELAY_MS * attempt)
        continue
      }
      throw lastError
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError
}
