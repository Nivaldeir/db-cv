"use client"

import { useState } from "react"
import { Search, Filter, Eye, FileText, MapPin, Briefcase, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { statusLabels, statusColors, type CV } from "@/app/(app)/utils/cv"
import { CVModal } from "./cv-modal"
import { CvPdfViewerModal } from "./cv-pdf-viewer-modal"
import { trpc } from "@/trpc/react"
import { Skeleton } from "@/components/ui/skeleton"

function getIdiomasDisplay(cv: CV): string {
  const idiomas = cv.extracao?.idiomas ?? []
  if (idiomas.length === 0) return "Não Identificado"
  const labels = idiomas
    .map((i) => {
      if (!i.idioma) return null
      if (!i.nivel) return i.idioma
      return `${i.idioma} (${i.nivel})`
    })
    .filter((v): v is string => Boolean(v))
  if (labels.length === 0) return "Não Identificado"
  return labels.join(", ")
}

function getEducacaoDisplay(cv: CV): string {
  const educacao = cv.extracao?.educacao ?? []
  if (educacao.length === 0) return "Não informado"
  const first = educacao[0]
  if (!first) return "Não informado"
  const curso = first.curso?.trim()
  const instituicao = first.instituicao?.trim()
  const grau = first.grau?.trim()
  return [grau, curso, instituicao].filter(Boolean).join(" - ") || "Não informado"
}

export function CVList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [cargoFilter, setCargoFilter] = useState<string>("todos")
  const [sourceFilter, setSourceFilter] = useState<string>("todos")
  const [selectedCV, setSelectedCV] = useState<CV | null>(null)
  const [pdfCvId, setPdfCvId] = useState<string | null>(null)
  const [pdfCvTitle, setPdfCvTitle] = useState<string | undefined>(undefined)

  const { data: cvs = [] as CV[], isLoading, isError } = trpc.cv.list.useQuery()
  const utils = trpc.useUtils()
  const updateCvStatus = trpc.cv.update.useMutation({
    onSuccess: async (updatedCv) => {
      setSelectedCV((prev) => (prev?.id === updatedCv.id ? updatedCv : prev))
      await utils.cv.list.invalidate()
    },
  })

  const handleMarkAsInAnalysis = (cvId: string) => {
    updateCvStatus.mutate({
      id: cvId,
      data: { status: "em_analise" },
    })
  }

  const cargos = [...new Set(cvs.map((cv: CV) => cv.cargo) as string[])]
  const sources = [
    ...new Set(cvs.map((cv: CV) => cv.sourceSheet ?? "Não informado") as string[]),
  ]

  const filteredCVs = cvs.filter((cv: CV) => {
    const idiomasText = (cv.extracao?.idiomas ?? [])
      .map((i) => [i.idioma, i.nivel].filter(Boolean).join(" "))
      .join(" ")
      .toLowerCase()
    const educacaoText = (cv.extracao?.educacao ?? [])
      .map((e) => [e.grau, e.curso, e.instituicao].filter(Boolean).join(" "))
      .join(" ")
      .toLowerCase()
    const resumoText = (cv.extracao?.resumoProfissional ?? "").toLowerCase()

    const matchesSearch =
      cv.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      cv.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idiomasText.includes(searchQuery.toLowerCase()) ||
      educacaoText.includes(searchQuery.toLowerCase()) ||
      resumoText.includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "todos" || cv.status === statusFilter
    const matchesCargo = cargoFilter === "todos" || cv.cargo === cargoFilter
    const cvSource = cv.sourceSheet ?? "Não informado"
    const matchesSource = sourceFilter === "todos" || cvSource === sourceFilter

    return matchesSearch && matchesStatus && matchesCargo && matchesSource
  })

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar a lista de CVs.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email, cargo ou skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={cargoFilter} onValueChange={setCargoFilter}>
            <SelectTrigger className="w-[180px] bg-secondary border-border">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os cargos</SelectItem>
              {cargos.map((cargo) => (
                <SelectItem key={cargo} value={cargo}>
                  {cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[220px] bg-secondary border-border">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as origens</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCVs.length} CV{filteredCVs.length !== 1 ? "s" : ""} encontrado
          {filteredCVs.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-foreground font-semibold whitespace-normal">Candidato</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal">Ultimos cargo</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal hidden md:table-cell">Localização</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal hidden lg:table-cell">Experiência</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal hidden xl:table-cell">Origem</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal hidden xl:table-cell">Idiomas</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal hidden xl:table-cell">Educação</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal">Status</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal hidden sm:table-cell">Data</TableHead>
              <TableHead className="text-foreground font-semibold whitespace-normal text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCVs.map((cv: CV) => (
              <TableRow
                key={cv.id}
                className="hover:bg-secondary/30 cursor-pointer transition-colors"
                onClick={() => setSelectedCV(cv)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{cv.nome}</span>
                    <span className="text-sm text-muted-foreground">{cv.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{cv.cargo}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{cv.localizacao}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell max-w-40 truncate">
                  <span className="text-muted-foreground">{cv.experiencia}</span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-muted-foreground">{cv.sourceSheet ?? "Não informado"}</span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-muted-foreground">{getIdiomasDisplay(cv)}</span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-muted-foreground">{getEducacaoDisplay(cv)}</span>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[cv.status]} variant="secondary">
                    {statusLabels[cv.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      {new Date(cv.dataSubmissao).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCV(cv)
                      }}
                      className="hover:bg-secondary"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalhes</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPdfCvId(cv.id)
                        setPdfCvTitle(cv.nome)
                      }}
                      className="hover:bg-secondary"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Ver CV em PDF</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredCVs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum CV encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou a pesquisa
          </p>
        </div>
      )}

      <CVModal
        cv={selectedCV}
        onClose={() => setSelectedCV(null)}
        onMarkAsInAnalysis={handleMarkAsInAnalysis}
        isUpdatingStatus={updateCvStatus.isPending}
      />
      <CvPdfViewerModal
        cvId={pdfCvId}
        title={pdfCvTitle ? `CV — ${pdfCvTitle}` : undefined}
        open={pdfCvId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPdfCvId(null)
            setPdfCvTitle(undefined)
          }
        }}
      />
    </div>
  )
}
