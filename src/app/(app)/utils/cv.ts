export interface CvExtracaoExperiencia {
  empresa: string | null
  cargo: string | null
  data_inicio: string | null
  data_fim: string | null
  atual: boolean | null
  descricao: string | null
  skills: string[]
}

export interface CvExtracaoEducacao {
  instituicao: string | null
  curso: string | null
  grau: string | null
  data_inicio: string | null
  data_fim: string | null
}

export interface CvExtracaoIdioma {
  idioma: string | null
  nivel: string | null
}

export interface CvExtracaoCertificacao {
  nome: string | null
  instituicao: string | null
  data: string | null
}

export interface CvExtracaoProjeto {
  nome: string | null
  descricao: string | null
  tecnologias: string[]
  link: string | null
}

export interface CvExtracaoDto {
  id: string
  dadosPessoais: {
    nome: string | null
    email: string | null
    telefone: string | null
    localizacao: string | null
    linkedin: string | null
    github: string | null
    portfolio: string | null
  }
  resumoProfissional: string | null
  experiencias: CvExtracaoExperiencia[]
  educacao: CvExtracaoEducacao[]
  skills: string[]
  idiomas: CvExtracaoIdioma[]
  certificacoes: CvExtracaoCertificacao[]
  projetos: CvExtracaoProjeto[]
  analiseIa: {
    areaProfissional: string | null
    senioridade: string | null
    anosExperiencia: number
    principaisCompetencias: string[]
  }
  atualizadoEm: string
}

export interface CV {
  id: string
  nome: string
  email: string
  telefone: string
  cargo: string
  experiencia: string
  localizacao: string
  skills: string[]
  status: "novo" | "em_analise" | "aprovado" | "rejeitado"
  dataSubmissao: string
  cvUrl: string
  resumo: string
  sourceSheet?: string | null
  aiSeen: boolean
  extracao?: CvExtracaoDto | null
}

export const statusLabels: Record<CV["status"], string> = {
  novo: "Novo",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
}

export const statusColors: Record<CV["status"], string> = {
  novo: "bg-blue-500/20 text-blue-400",
  em_analise: "bg-yellow-500/20 text-yellow-400",
  aprovado: "bg-primary/20 text-primary",
  rejeitado: "bg-destructive/20 text-destructive",
}
