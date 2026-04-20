import { DashboardPage } from "@/components/dashboard-page";

export default function TrackingPage() {
  return <DashboardPage endpoint="/api/tracking" titleFallback="Tracking" />;
}
