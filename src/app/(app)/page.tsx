import { StatsCards } from "./_components/stats-cards"
import { CVList } from "./_components/cv-list"
import { DashboardHeader } from "./_components/dashboard-header"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader />
      <StatsCards />
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Candidatos Recentes
        </h2>
        <CVList />
      </div>
    </div>
  )
}
