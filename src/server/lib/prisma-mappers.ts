import type {
  Cv as PrismaCv,
  CvExtraction,
  Candidate as PrismaCandidate,
  CandidateNote,
  CandidateHistory,
} from "@prisma/client"
import type {
  CV,
  CvExtracaoCertificacao,
  CvExtracaoDto,
  CvExtracaoEducacao,
  CvExtracaoExperiencia,
  CvExtracaoIdioma,
  CvExtracaoProjeto,
} from "@/app/(app)/utils/cv"
import type { Candidate } from "@/app/(app)/utils/candidates"

function parseSkillsJson(value: string): string[] {
  try {
    const v = JSON.parse(value) as unknown
    if (!Array.isArray(v)) return []
    return v.filter((x): x is string => typeof x === "string")
  } catch {
    return []
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseExperienciasJson(value: unknown): CvExtracaoExperiencia[] {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const x = raw as Record<string, unknown>
    const skillsRaw = x.skills
    const skills = Array.isArray(skillsRaw)
      ? skillsRaw.filter((s): s is string => typeof s === "string")
      : []
    return {
      empresa: typeof x.empresa === "string" ? x.empresa : null,
      cargo: typeof x.cargo === "string" ? x.cargo : null,
      data_inicio: typeof x.data_inicio === "string" ? x.data_inicio : null,
      data_fim: typeof x.data_fim === "string" ? x.data_fim : null,
      atual: typeof x.atual === "boolean" ? x.atual : null,
      descricao: typeof x.descricao === "string" ? x.descricao : null,
      skills,
    }
  })
}

function parseEducacaoJson(value: unknown): CvExtracaoEducacao[] {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const x = raw as Record<string, unknown>
    return {
      instituicao: typeof x.instituicao === "string" ? x.instituicao : null,
      curso: typeof x.curso === "string" ? x.curso : null,
      grau: typeof x.grau === "string" ? x.grau : null,
      data_inicio: typeof x.data_inicio === "string" ? x.data_inicio : null,
      data_fim: typeof x.data_fim === "string" ? x.data_fim : null,
    }
  })
}

function parseIdiomasJson(value: unknown): CvExtracaoIdioma[] {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const x = raw as Record<string, unknown>
    return {
      idioma: typeof x.idioma === "string" ? x.idioma : null,
      nivel: typeof x.nivel === "string" ? x.nivel : null,
    }
  })
}

function parseCertificacoesJson(value: unknown): CvExtracaoCertificacao[] {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const x = raw as Record<string, unknown>
    return {
      nome: typeof x.nome === "string" ? x.nome : null,
      instituicao: typeof x.instituicao === "string" ? x.instituicao : null,
      data: typeof x.data === "string" ? x.data : null,
    }
  })
}

function parseProjetosJson(value: unknown): CvExtracaoProjeto[] {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const x = raw as Record<string, unknown>
    const techRaw = x.tecnologias
    const tecnologias = Array.isArray(techRaw)
      ? techRaw.filter((t): t is string => typeof t === "string")
      : []
    return {
      nome: typeof x.nome === "string" ? x.nome : null,
      descricao: typeof x.descricao === "string" ? x.descricao : null,
      tecnologias,
      link: typeof x.link === "string" ? x.link : null,
    }
  })
}

function mapCvExtractionToDto(e: CvExtraction): CvExtracaoDto {
  const skillsJson = e.skills
  const skills = Array.isArray(skillsJson)
    ? skillsJson.filter((s): s is string => typeof s === "string")
    : []
  const principais = e.principaisCompetencias
  const principaisCompetencias = Array.isArray(principais)
    ? principais.filter((s): s is string => typeof s === "string")
    : []

  return {
    id: e.id,
    dadosPessoais: {
      nome: e.nome,
      email: e.email,
      telefone: e.telefone,
      localizacao: e.localizacao,
      linkedin: e.linkedin,
      github: e.github,
      portfolio: e.portfolio,
    },
    resumoProfissional: e.resumoProfissional,
    experiencias: parseExperienciasJson(e.experiencias),
    educacao: parseEducacaoJson(e.educacao),
    skills,
    idiomas: parseIdiomasJson(e.idiomas),
    certificacoes: parseCertificacoesJson(e.certificacoes),
    projetos: parseProjetosJson(e.projetos),
    analiseIa: {
      areaProfissional: e.areaProfissional,
      senioridade: e.senioridade,
      anosExperiencia: e.anosExperiencia ?? 0,
      principaisCompetencias,
    },
    atualizadoEm: e.updatedAt.toISOString(),
  }
}

export function mapCvToDto(
  row: PrismaCv & { extraction?: CvExtraction | null },
): CV {
  return {
    id: row.id,
    nome: row.name,
    email: row.email,
    telefone: row.phone,
    cargo: row.jobTitle,
    experiencia: row.experience,
    localizacao: row.location,
    skills: parseSkillsJson(row.skills),
    status: row.status as CV["status"],
    dataSubmissao: formatDate(row.submittedAt),
    cvUrl: row.cvUrl,
    resumo: row.summary,
    sourceSheet: row.sourceSheet,
    aiSeen: row.aiSeen,
    extracao: row.extraction ? mapCvExtractionToDto(row.extraction) : null,
  }
}

export function mapCandidateToDto(
  row: PrismaCandidate & {
    notes: CandidateNote[]
    history: CandidateHistory[]
  },
): Candidate {
  return {
    id: row.id,
    nome: row.name,
    email: row.email,
    telefone: row.phone,
    cargo: row.jobTitle,
    experiencia: row.experience,
    localizacao: row.location,
    skills: parseSkillsJson(row.skills),
    status: row.status as Candidate["status"],
    dataSubmissao: formatDate(row.submittedAt),
    cvUrl: row.cvUrl,
    resumo: row.summary,
    favorito: row.isFavorite,
    rating: row.rating,
    fonte: row.source,
    salarioPretendido: row.expectedSalary ?? undefined,
    disponibilidade: row.availability ?? undefined,
    notas: row.notes.map((n) => ({
      id: n.id,
      autor: n.author,
      texto: n.text,
      data: formatDate(n.recordedAt),
    })),
    historico: row.history.map((h) => ({
      id: h.id,
      acao: h.action,
      autor: h.author,
      data: formatDate(h.recordedAt),
      detalhes: h.details ?? undefined,
    })),
  }
}
