import { DashboardPage } from "@/components/dashboard-page";

export default function OpportunitiesPage() {
  return <DashboardPage endpoint="/api/opportunities" titleFallback="Opportunities" />;
}
