import { DashboardPage } from "@/components/dashboard-page";

export default function TerritoryAnalysisPage() {
  return <DashboardPage endpoint="/api/territories" titleFallback="Territory Analysis" />;
}
