"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type CvPdfViewerModalProps = {
  cvId: string | null
  title?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CvPdfViewerModal({
  cvId,
  title,
  open,
  onOpenChange,
}: CvPdfViewerModalProps) {
  const [loadToken, setLoadToken] = useState(0)

  useEffect(() => {
    if (open && cvId) {
      setLoadToken((t) => t + 1)
    }
  }, [open, cvId])

  if (!cvId) return null
  const src =
    loadToken > 0
      ? `/api/cv/${cvId}/pdf?t=${loadToken}`
      : `/api/cv/${cvId}/pdf`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,1200px)] w-full h-[min(90vh,900px)] flex flex-col p-0 gap-0 overflow-hidden sm:max-w-[min(96vw,1200px)]">
        <DialogHeader className="px-6 pt-6 pb-2 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <DialogTitle>{title ?? "CV (PDF)"}</DialogTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cvs/${cvId}/visualizar`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova página
            </Link>
          </Button>
        </DialogHeader>
        <div className="flex flex-1 flex-col px-6 pb-6 min-h-0">
          <iframe
            key={`${cvId}-${loadToken}`}
            title="CV PDF"
            src={src}
            className="flex-1 w-full min-h-[60vh] rounded-md border border-border bg-muted"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
