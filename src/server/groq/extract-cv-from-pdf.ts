// @ts-expect-error -- pdf-parse types only export the index entry; importing the
// lib path avoids the package's debug-mode side-effect on require.
import pdfParse from "pdf-parse/lib/pdf-parse.js"
import type { Result as PdfParseResult } from "pdf-parse"
import { CV_PDF_EXTRACTION_PROMPT } from "@/server/gemini/cv-pdf-extraction-prompt"
import {
  cvExtractionResultSchema,
  type CvExtractionResult,
} from "@/server/gemini/cv-extraction-schema"

const DEFAULT_MODEL = "llama-3.3-70b-versatile"
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const MAX_PDF_BYTES = 20 * 1024 * 1024
const MAX_TEXT_CHARS = 60_000

export class GroqCvExtractionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = "GroqCvExtractionError"
  }
}

export type ExtractCvFromPdfWithGroqOptions = {
  apiKey?: string
  model?: string
}

async function pdfBufferToText(buffer: Buffer): Promise<string> {
  const parsed = (await (pdfParse as (b: Buffer) => Promise<PdfParseResult>)(
    buffer,
  ))
  const text = (parsed.text ?? "").trim()
  if (text.length === 0) {
    throw new GroqCvExtractionError("PDF não contém texto legível.")
  }
  return text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim()
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)```$/m.exec(trimmed)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

export async function extractCvFromPdfWithGroq(
  pdfBuffer: Buffer,
  options: ExtractCvFromPdfWithGroqOptions = {},
): Promise<CvExtractionResult> {
  const apiKey = options.apiKey ?? process.env.GROQ_API_KEY
  if (!apiKey?.trim()) {
    throw new GroqCvExtractionError(
      "GROQ_API_KEY não definida. Configure a variável de ambiente.",
    )
  }
  if (pdfBuffer.length === 0) {
    throw new GroqCvExtractionError("O PDF está vazio.")
  }
  if (pdfBuffer.length > MAX_PDF_BYTES) {
    throw new GroqCvExtractionError(
      `PDF excede o limite de ${MAX_PDF_BYTES / (1024 * 1024)} MB.`,
    )
  }

  const cvText = await pdfBufferToText(pdfBuffer)
  const modelName = options.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL

  let response: Response
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CV_PDF_EXTRACTION_PROMPT },
          {
            role: "user",
            content: `Texto extraído do PDF do currículo:\n\n${cvText}`,
          },
        ],
      }),
    })
  } catch (e) {
    throw new GroqCvExtractionError("Falha ao chamar a API Groq.", e)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new GroqCvExtractionError(
      `Groq retornou HTTP ${response.status}. ${body.slice(0, 500)}`,
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (e) {
    throw new GroqCvExtractionError("Resposta da Groq não é JSON.", e)
  }

  const text =
    (payload as { choices?: { message?: { content?: string } }[] })
      ?.choices?.[0]?.message?.content ?? ""
  if (!text.trim()) {
    throw new GroqCvExtractionError("Resposta vazia da Groq.")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonPayload(text))
  } catch (e) {
    throw new GroqCvExtractionError("Resposta da Groq não é JSON válido.", e)
  }

  const validated = cvExtractionResultSchema.safeParse(parsed)
  if (!validated.success) {
    throw new GroqCvExtractionError(
      "JSON retornado não corresponde ao schema esperado.",
      validated.error,
    )
  }
  return validated.data
}
