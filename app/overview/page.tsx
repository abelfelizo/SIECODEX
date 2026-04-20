import { DashboardPage } from "@/components/dashboard-page";

export default function OverviewPage() {
  return <DashboardPage endpoint="/api/overview" titleFallback="Overview" />;
}
