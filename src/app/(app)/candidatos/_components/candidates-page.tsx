"use client"

import { useState } from "react"
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  StarOff,
  MapPin,
  Briefcase,
  Calendar,
  Mail,
  MoreVertical,
  Clock,
  Plus,
  Download,
  UserPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CandidateDetailModal } from "./candidate-detail-modal"
import {
  type Candidate,
  pipelineStages,
  candidateStatusColors,
  candidateStatusLabels,
} from "@/app/(app)/utils/candidates"
import { type CV } from "@/app/(app)/utils/cv"
import { trpc } from "@/trpc/react"
import { Skeleton } from "@/components/ui/skeleton"

export function CandidatesPage() {
  const utils = trpc.useUtils()
  const { data: candidates = [], isLoading, isError } =
    trpc.candidate.list.useQuery()
  const { data: cvs = [] } = trpc.cv.list.useQuery()

  const [searchTerm, setSearchTerm] = useState("")
  const [cvSearchTerm, setCvSearchTerm] = useState("")
  const [isSelectCvOpen, setIsSelectCvOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [filterCargo, setFilterCargo] = useState<string>("all")
  const [filterFonte, setFilterFonte] = useState<string>("all")

  const updateMutation = trpc.candidate.update.useMutation({
    onSuccess: (updated) => {
      void utils.candidate.list.invalidate()
      setSelectedCandidate((prev) =>
        prev?.id === updated.id ? updated : prev,
      )
    },
  })
  const updateStatusMutation = trpc.candidate.updateStatus.useMutation({
    onSuccess: (updated) => {
      void utils.candidate.list.invalidate()
      setSelectedCandidate((prev) =>
        prev?.id === updated.id ? updated : prev,
      )
    },
  })
  const createCandidateMutation = trpc.candidate.create.useMutation({
    onSuccess: (created) => {
      void utils.candidate.list.invalidate()
      setSelectedCandidate(created)
      setIsSelectCvOpen(false)
      setCvSearchTerm("")
    },
  })

  const cargos = [...new Set(candidates.map(c => c.cargo))]
  const fontes = [...new Set(candidates.map(c => c.fonte))]

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCargo = filterCargo === "all" || candidate.cargo === filterCargo
    const matchesFonte = filterFonte === "all" || candidate.fonte === filterFonte

    return matchesSearch && matchesCargo && matchesFonte
  })

  const existingCandidateKeys = new Set(
    candidates.map((c) => `${c.email.toLowerCase()}::${c.cvUrl}`),
  )

  const availableCvs = cvs.filter(
    (cv) => !existingCandidateKeys.has(`${cv.email.toLowerCase()}::${cv.cvUrl}`),
  )

  const filteredAvailableCvs = availableCvs.filter((cv) => {
    const q = cvSearchTerm.toLowerCase()
    if (!q) return true
    return (
      cv.nome.toLowerCase().includes(q) ||
      cv.email.toLowerCase().includes(q) ||
      cv.cargo.toLowerCase().includes(q) ||
      cv.skills.some((s) => s.toLowerCase().includes(q))
    )
  })

  const toggleFavorite = (id: string) => {
    const c = candidates.find((x) => x.id === id)
    if (!c) return
    updateMutation.mutate({ id, data: { favorito: !c.favorito } })
  }

  const moveCandidate = (candidateId: string, newStatus: Candidate["status"]) => {
    updateStatusMutation.mutate({ id: candidateId, status: newStatus })
  }

  const rejectCandidate = (candidateId: string) => {
    moveCandidate(candidateId, "rejeitado")
  }

  const addCandidateFromCv = (cv: CV) => {
    createCandidateMutation.mutate({
      nome: cv.nome || "Sem nome",
      email: cv.email || "sem-email@importado.local",
      telefone: cv.telefone || "—",
      cargo: cv.cargo || "—",
      experiencia: cv.experiencia || "—",
      localizacao: cv.localizacao || "—",
      skills: cv.skills,
      status: "novo",
      dataSubmissao: cv.dataSubmissao,
      cvUrl: cv.cvUrl,
      resumo: cv.resumo || "",
      favorito: false,
      rating: 0,
      fonte: "Banco de CVs",
    })
  }

  const mutationPending =
    updateMutation.isPending ||
    updateStatusMutation.isPending ||
    createCandidateMutation.isPending

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar os candidatos.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    )
  }

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all group"
      onClick={() => setSelectedCandidate(candidate)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-secondary text-foreground text-sm">
                {candidate.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {candidate.nome}
              </h4>
              <p className="text-xs text-muted-foreground">{candidate.cargo}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(candidate.id) }}
            disabled={mutationPending}
            className="text-muted-foreground hover:text-yellow-400 transition-colors disabled:opacity-50"
          >
            {candidate.favorito ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{candidate.skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {candidate.localizacao.split(",")[0]}
          </div>
          {renderStars(candidate.rating)}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(candidate.dataSubmissao).toLocaleDateString("pt-PT")}
          </div>
          <Badge variant="outline" className="text-[10px]">
            {candidate.fonte}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Candidatos
          </h1>
          <p className="text-muted-foreground">
            Gerencie o pipeline de recrutamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsSelectCvOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Candidato
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, cargo, skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterCargo} onValueChange={setFilterCargo}>
            <SelectTrigger className="w-[180px]">
              <Briefcase className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Cargos</SelectItem>
              {cargos.map(cargo => (
                <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFonte} onValueChange={setFilterFonte}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Fontes</SelectItem>
              {fontes.map(fonte => (
                <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-md">
            <Button 
              variant={viewMode === "kanban" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("kanban")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelineStages.map(stage => {
              const stageCandidates = filteredCandidates.filter(c => c.status === stage.id)
              return (
                <div key={stage.id} className="w-72 shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <h3 className="font-medium text-sm text-foreground">{stage.label}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {stageCandidates.length}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-3">
                    {stageCandidates.map(candidate => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                    {stageCandidates.length === 0 && (
                      <div className="border border-dashed border-border rounded-lg p-4 text-center text-muted-foreground text-sm">
                        Nenhum candidato
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Candidato</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cargo</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rating</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fonte</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(candidate => (
                  <tr 
                    key={candidate.id} 
                    className="border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(candidate.id) }}
                          disabled={mutationPending}
                          className="text-muted-foreground hover:text-yellow-400 transition-colors disabled:opacity-50"
                        >
                          {candidate.favorito ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-foreground text-xs">
                            {candidate.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-foreground">{candidate.nome}</p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-foreground">{candidate.cargo}</p>
                      <p className="text-xs text-muted-foreground">{candidate.experiencia}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={candidateStatusColors[candidate.status]}>
                        {candidateStatusLabels[candidate.status]}
                      </Badge>
                    </td>
                    <td className="p-4">{renderStars(candidate.rating)}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">{candidate.fonte}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(candidate.dataSubmissao).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate) }}>
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(candidate.cvUrl, "_blank", "noopener,noreferrer")
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download CV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `mailto:${candidate.email}`
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={mutationPending}
                            onClick={(e) => {
                              e.stopPropagation()
                              rejectCandidate(candidate.id)
                            }}
                          >
                            Rejeitar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onStatusChange={(newStatus) => {
            moveCandidate(selectedCandidate.id, newStatus)
          }}
          onReextracted={(updated) => setSelectedCandidate(updated)}
        />
      )}

      <Dialog open={isSelectCvOpen} onOpenChange={setIsSelectCvOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar candidato a partir dos CVs cadastrados</DialogTitle>
            <DialogDescription>
              Selecione um CV ainda não convertido em candidato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={cvSearchTerm}
                onChange={(e) => setCvSearchTerm(e.target.value)}
                placeholder="Pesquisar CV por nome, email, cargo ou skill..."
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-auto border border-border rounded-md divide-y divide-border">
              {filteredAvailableCvs.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhum CV disponível para adicionar.
                </div>
              ) : (
                filteredAvailableCvs.map((cv) => (
                  <div key={cv.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cv.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{cv.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{cv.cargo}</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={mutationPending}
                      onClick={() => addCandidateFromCv(cv)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Selecionar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
