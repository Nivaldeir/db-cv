"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Briefcase, Clock, Calendar, FileDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { type CV, statusLabels, statusColors } from "@/app/(app)/utils/cv"

interface CVModalProps {
  cv: CV | null
  onClose: () => void
}

export function CVModal({ cv, onClose }: CVModalProps) {
  if (!cv) return null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="w-[1100px] overflow-y-auto bg-card border-border">
        <DialogHeader className="flex flex-row items-start justify-between">
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {cv.nome}
            </DialogTitle>
            <Badge className={statusColors[cv.status]} variant="secondary">
              {statusLabels[cv.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span>{cv.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>{cv.telefone}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{cv.localizacao}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                Submetido em{" "}
                {new Date(cv.dataSubmissao).toLocaleDateString("pt-PT")}
              </span>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Informação Profissional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium text-foreground">{cv.cargo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experiência</p>
                  <p className="font-medium text-foreground">{cv.experiencia}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Competências
            </h4>
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-secondary text-foreground"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Resumo
            </h4>
            <p className="text-muted-foreground leading-relaxed">{cv.resumo}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href={`/api/cv/${cv.id}/pdf`} download>
                <FileDown className="h-4 w-4 mr-2" />
                Descarregar PDF
              </a>
            </Button>
            <Button variant="outline" className="flex-1 border-border" asChild>
              <Link href={`/cvs/${cv.id}/visualizar`}>
                <FileText className="h-4 w-4 mr-2" />
                Ver PDF (página)
              </Link>
            </Button>
            <Button variant="outline" className="flex-1 border-border">
              Marcar como Em Análise
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
