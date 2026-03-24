import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ id: string }> }

export default async function CvVisualizarPage({ params }: Props) {
  const { id } = await params
  const src = `/api/cv/${id}/pdf`

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)] min-h-[480px]">
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao dashboard
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={src} download>
            Descarregar PDF
          </a>
        </Button>
      </div>
      <iframe
        key={id}
        title="Visualização do CV"
        src={src}
        className="flex-1 w-full min-h-[400px] rounded-lg border border-border bg-muted"
      />
    </div>
  )
}
