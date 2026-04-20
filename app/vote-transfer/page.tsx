import { DashboardPage } from "@/components/dashboard-page";

export default function VoteTransferPage() {
  return <DashboardPage endpoint="/api/vote-transfer" titleFallback="Vote Transfer" />;
}
