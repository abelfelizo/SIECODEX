import { NextResponse } from "next/server";
import { buildTrackingDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildTrackingDashboard();
  return NextResponse.json(payload);
}
