import { NextResponse } from "next/server";
import { buildTerritoryDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildTerritoryDashboard();
  return NextResponse.json(payload);
}
