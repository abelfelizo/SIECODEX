import { NextResponse } from "next/server";
import { buildStrategicMapDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildStrategicMapDashboard();
  return NextResponse.json(payload);
}
