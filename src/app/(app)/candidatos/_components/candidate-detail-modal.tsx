"use client"

import { useState } from "react"
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Download,
  Star,
  Clock,
  MessageSquare,
  User,
  ChevronRight,
  Send,
  DollarSign,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Candidate } from "@/app/(app)/utils/candidates"

interface CandidateDetailModalProps {
  candidate: Candidate
  onClose: () => void
  onStatusChange: (status: Candidate["status"]) => void
}

const statusOptions = [
  { value: "novo", label: "Novo" },
  { value: "triagem", label: "Triagem" },
  { value: "entrevista_rh", label: "Entrevista RH" },
  { value: "entrevista_tecnica", label: "Entrevista Técnica" },
  { value: "oferta", label: "Oferta" },
  { value: "contratado", label: "Contratado" },
  { value: "rejeitado", label: "Rejeitado" },
]

const statusColors: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  triagem: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  entrevista_rh: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  entrevista_tecnica: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  oferta: "bg-primary/20 text-primary border-primary/30",
  contratado: "bg-green-500/20 text-green-400 border-green-500/30",
  rejeitado: "bg-destructive/20 text-destructive border-destructive/30",
}

export function CandidateDetailModal({ candidate, onClose, onStatusChange }: CandidateDetailModalProps) {
  const [newNote, setNewNote] = useState("")
  const [rating, setRating] = useState(candidate.rating)

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
            className={interactive ? "cursor-pointer" : "cursor-default"}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= currentRating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground/30 hover:text-yellow-400/50"
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-secondary text-foreground text-lg">
                {candidate.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{candidate.nome}</h2>
              <p className="text-muted-foreground">{candidate.cargo}</p>
              <div className="flex items-center gap-3 mt-2">
                {renderStars(rating, true)}
                <Badge className={statusColors[candidate.status]}>
                  {statusOptions.find(s => s.value === candidate.status)?.label}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-border">
            {/* Main Content */}
            <div className="lg:col-span-2 p-6">
              <Tabs defaultValue="resumo" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                  <TabsTrigger value="notas">Notas ({candidate.notas.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Sobre</h3>
                    <p className="text-foreground">{candidate.resumo}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Competências</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map(skill => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-xs">Experiência</span>
                      </div>
                      <p className="font-medium text-foreground">{candidate.experiencia}</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">Localização</span>
                      </div>
                      <p className="font-medium text-foreground">{candidate.localizacao}</p>
                    </div>
                    {candidate.salarioPretendido && (
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">Salário Pretendido</span>
                        </div>
                        <p className="font-medium text-foreground">{candidate.salarioPretendido}</p>
                      </div>
                    )}
                    {candidate.disponibilidade && (
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">Disponibilidade</span>
                        </div>
                        <p className="font-medium text-foreground">{candidate.disponibilidade}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4">
                  <div className="relative pl-6 border-l-2 border-border space-y-6">
                    {candidate.historico.map((item, index) => (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div>
                          <p className="font-medium text-foreground">{item.acao}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span>{item.autor}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.data).toLocaleDateString("pt-PT")}</span>
                          </div>
                          {item.detalhes && (
                            <p className="text-sm text-muted-foreground mt-1 pl-5">{item.detalhes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="notas" className="space-y-4">
                  <div className="space-y-4">
                    {candidate.notas.length > 0 ? (
                      candidate.notas.map(nota => (
                        <div key={nota.id} className="p-4 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {nota.autor.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm text-foreground">{nota.autor}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(nota.data).toLocaleDateString("pt-PT")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{nota.texto}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        Nenhuma nota registada
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Adicionar uma nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button className="w-full" disabled={!newNote.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="p-6 bg-secondary/30 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Mover para</h3>
                <Select value={candidate.status} onValueChange={(value) => onStatusChange(value as Candidate["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Contacto</h3>
                <a 
                  href={`mailto:${candidate.email}`}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-secondary transition-colors group"
                >
                  <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  <span className="text-sm text-foreground truncate">{candidate.email}</span>
                </a>
                <a 
                  href={`tel:${candidate.telefone}`}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-secondary transition-colors group"
                >
                  <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  <span className="text-sm text-foreground">{candidate.telefone}</span>
                </a>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Detalhes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fonte</span>
                    <span className="text-foreground">{candidate.fonte}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Candidatura</span>
                    <span className="text-foreground">
                      {new Date(candidate.dataSubmissao).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download CV
                </Button>
                {/* <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Entrevista
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
