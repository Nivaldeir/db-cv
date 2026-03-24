import { createHash } from "node:crypto"

export function minioObjectKeyForPdfUrl(pdfUrl: string): string {
  const hash = createHash("sha256").update(pdfUrl).digest("hex").slice(0, 24)
  return `imports/google-sheet/${hash}.pdf`
}
