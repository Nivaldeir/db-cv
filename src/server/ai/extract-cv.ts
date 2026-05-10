import { extractCvFromPdfWithGemini } from "@/server/gemini/extract-cv-from-pdf"
import { extractCvFromPdfWithGroq } from "@/server/groq/extract-cv-from-pdf"
import type { CvExtractionResult } from "@/server/gemini/cv-extraction-schema"

export type AiProvider = "gemini" | "groq"

export type ExtractCvResult = {
  result: CvExtractionResult
  provider: AiProvider
}

export class CvExtractionFailedError extends Error {
  constructor(
    message: string,
    public readonly geminiError: unknown,
    public readonly groqError: unknown,
  ) {
    super(message)
    this.name = "CvExtractionFailedError"
  }
}

export async function extractCvFromPdf(
  pdfBuffer: Buffer,
): Promise<ExtractCvResult> {
  let geminiError: unknown = null
  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      const result = await extractCvFromPdfWithGemini(pdfBuffer)
      return { result, provider: "gemini" }
    } catch (e) {
      geminiError = e
    }
  }

  let groqError: unknown = null
  if (process.env.GROQ_API_KEY?.trim()) {
    try {
      const result = await extractCvFromPdfWithGroq(pdfBuffer)
      return { result, provider: "groq" }
    } catch (e) {
      groqError = e
    }
  }

  throw new CvExtractionFailedError(
    "Falha na extração: Gemini e Groq indisponíveis.",
    geminiError,
    groqError,
  )
}
