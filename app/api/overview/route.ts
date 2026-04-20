import { NextResponse } from "next/server";
import { buildOverviewDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildOverviewDashboard();
  return NextResponse.json(payload);
}
