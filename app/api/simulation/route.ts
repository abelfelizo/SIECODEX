import { NextRequest, NextResponse } from "next/server";
import { buildSimulationDashboard } from "@/lib/engines/intelligence";
import type { SimulationInput } from "@/lib/types";

export async function GET() {
  const payload = await buildSimulationDashboard();
  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SimulationInput;
  const payload = await buildSimulationDashboard(body);
  return NextResponse.json(payload);
}
