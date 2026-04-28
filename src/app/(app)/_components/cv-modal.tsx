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

const GERADO_IA = " (Gerado por IA)"

function iaLabel(base: string) {
  return `${base}${GERADO_IA}`
}

function ExperienciaFormatada({ texto }: { texto: string }) {
  const linhas = texto.split("\n").map((l) => l.trim()).filter(Boolean)

  const meta: string[] = []
  const historico: string[] = []

  for (const linha of linhas) {
    const lLow = linha.toLowerCase()
    if (
      lLow.startsWith("~") ||
      lLow.startsWith("nivel") ||
      lLow.startsWith("nível") ||
      /^\d+\s*anos?/.test(lLow) ||
      lLow.includes("estimativa")
    ) {
      meta.push(linha)
    } else {
      historico.push(linha)
    }
  }

  if (meta.length === 0 && historico.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meta.map((m, i) => (
            <span
              key={i}
              className="inline-flex items-center text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-md"
            >
              {m}
            </span>
          ))}
        </div>
      )}
      {historico.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-foreground">
          {historico.map((h, i) => (
            <li key={i} className="flex items-start gap-1.5 leading-snug">
              <span className="mt-1.25 h-1.5 w-1.5 rounded-full bg-border shrink-0" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface CVModalProps {
  cv: CV | null
  onClose: () => void
  onMarkAsInAnalysis: (cvId: string) => void
  isUpdatingStatus?: boolean
}

export function CVModal({
  cv,
  onClose,
  onMarkAsInAnalysis,
  isUpdatingStatus = false,
}: CVModalProps) {
  if (!cv) return null

  const ext = cv.extracao
  const iaResumo = ext?.resumoProfissional?.trim() ?? ""
  const summaryOutro = cv.resumo?.trim() ?? ""
  const mostrarResumoAlternativo =
    summaryOutro.length > 0 && summaryOutro !== iaResumo

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="w-[min(1100px,95vw)] max-h-[90dvh] flex flex-col bg-card border-border">
        <DialogHeader className="flex flex-row items-start justify-between shrink-0">
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {cv.nome}
            </DialogTitle>
            <Badge className={statusColors[cv.status]} variant="secondary">
              {statusLabels[cv.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4 overflow-y-auto pr-1 min-h-0">
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
                  <p className="text-sm text-muted-foreground">
                    {ext ? iaLabel("Último Cargo") : "Último Cargo"}
                  </p>
                  <p className="font-medium text-foreground">{cv.cargo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {ext ? iaLabel("Experiência") : "Experiência"}
                  </p>
                  <ExperienciaFormatada texto={cv.experiencia ?? ""} />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {ext ? iaLabel("Competências") : "Competências"}
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

          {iaResumo ? (
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {iaLabel("Resumo profissional")}
              </h4>
              <p className="text-muted-foreground leading-relaxed">{iaResumo}</p>
            </div>
          ) : summaryOutro ? (
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Resumo
              </h4>
              <p className="text-muted-foreground leading-relaxed">{summaryOutro}</p>
            </div>
          ) : null}

          {mostrarResumoAlternativo ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Resumo
                </h4>
                <p className="text-muted-foreground leading-relaxed">{summaryOutro}</p>
              </div>
            </>
          ) : null}

          {ext && ext.experiencias.length > 0 ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {iaLabel("Experiências")}
                </h4>
                <ul className="space-y-4 list-none max-h-72 overflow-y-auto pr-1">
                  {ext.experiencias.map((exp, i) => (
                    <li
                      key={`${exp.empresa ?? ""}-${exp.cargo ?? ""}-${i}`}
                      className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2"
                    >
                      <p className="font-medium text-foreground">
                        {[exp.cargo, exp.empresa].filter(Boolean).join(" · ") ||
                          "Experiência"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          exp.data_inicio,
                          exp.atual ? "Atual" : exp.data_fim,
                        ]
                          .filter(Boolean)
                          .join(" → ")}
                      </p>
                      {exp.descricao?.trim() ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {iaLabel("Descrição")}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {exp.descricao}
                          </p>
                        </div>
                      ) : null}
                      {exp.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {exp.skills.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="bg-secondary text-foreground text-xs font-normal"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {ext && ext.educacao.length > 0 ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {iaLabel("Educação")}
                </h4>
                <ul className="space-y-3 list-none">
                  {ext.educacao.map((ed, i) => (
                    <li
                      key={`${ed.instituicao ?? ""}-${ed.curso ?? ""}-${i}`}
                      className="text-sm text-muted-foreground"
                    >
                      <span className="text-foreground font-medium">
                        {[ed.grau, ed.curso].filter(Boolean).join(" — ") ||
                          "Formação"}
                      </span>
                      {ed.instituicao ? (
                        <span className="block">{ed.instituicao}</span>
                      ) : null}
                      {[ed.data_inicio, ed.data_fim].filter(Boolean).length >
                      0 ? (
                        <span className="block text-xs">
                          {[ed.data_inicio, ed.data_fim]
                            .filter(Boolean)
                            .join(" → ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {ext && ext.idiomas.length > 0 ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {iaLabel("Idiomas")}
                </h4>
                <ul className="space-y-1 list-none text-sm text-muted-foreground">
                  {ext.idiomas.map((idm, i) => (
                    <li key={`${idm.idioma ?? ""}-${i}`}>
                      {[idm.idioma, idm.nivel].filter(Boolean).join(" — ") ||
                        "—"}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {ext && ext.certificacoes.length > 0 ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {iaLabel("Certificações")}
                </h4>
                <ul className="space-y-2 list-none text-sm text-muted-foreground">
                  {ext.certificacoes.map((c, i) => (
                    <li key={`${c.nome ?? ""}-${i}`}>
                      <span className="text-foreground font-medium">
                        {c.nome ?? "Certificação"}
                      </span>
                      {[c.instituicao, c.data].filter(Boolean).length > 0 ? (
                        <span className="block text-xs">
                          {[c.instituicao, c.data].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {ext && ext.projetos.length > 0 ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {iaLabel("Projetos")}
                </h4>
                <ul className="space-y-4 list-none">
                  {ext.projetos.map((proj, i) => (
                    <li
                      key={`${proj.nome ?? ""}-${i}`}
                      className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2"
                    >
                      <p className="font-medium text-foreground">
                        {proj.nome ?? "Projeto"}
                      </p>
                      {proj.descricao?.trim() ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {iaLabel("Descrição")}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {proj.descricao}
                          </p>
                        </div>
                      ) : null}
                      {proj.tecnologias.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.tecnologias.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="bg-secondary text-foreground text-xs font-normal"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {proj.link?.trim() ? (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-4 hover:underline break-all"
                        >
                          {proj.link}
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {ext &&
          (ext.analiseIa.areaProfissional?.trim() ||
            ext.analiseIa.senioridade?.trim() ||
            ext.analiseIa.anosExperiencia > 0 ||
            ext.analiseIa.principaisCompetencias.length > 0) ? (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {iaLabel("Análise")}
                </h4>
                <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3 text-sm">
                  {ext.analiseIa.areaProfissional?.trim() ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {iaLabel("Área profissional")}
                      </p>
                      <p className="text-foreground">
                        {ext.analiseIa.areaProfissional}
                      </p>
                    </div>
                  ) : null}
                  {ext.analiseIa.senioridade?.trim() ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {iaLabel("Senioridade")}
                      </p>
                      <p className="text-foreground">
                        {ext.analiseIa.senioridade}
                      </p>
                    </div>
                  ) : null}
                  {ext.analiseIa.anosExperiencia > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {iaLabel("Anos de experiência (estimativa)")}
                      </p>
                      <p className="text-foreground">
                        ~{ext.analiseIa.anosExperiencia}
                      </p>
                    </div>
                  ) : null}
                  {ext.analiseIa.principaisCompetencias.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {iaLabel("Principais competências")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ext.analiseIa.principaisCompetencias.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="bg-secondary text-foreground text-xs font-normal"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

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
            <Button
              variant="outline"
              className="flex-1 border-border"
              disabled={cv.status === "em_analise" || isUpdatingStatus}
              onClick={() => onMarkAsInAnalysis(cv.id)}
            >
              Marcar como Em Análise
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
