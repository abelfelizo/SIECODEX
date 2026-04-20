import { NextResponse } from "next/server";
import { buildOptimizationDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildOptimizationDashboard();
  return NextResponse.json(payload);
}
