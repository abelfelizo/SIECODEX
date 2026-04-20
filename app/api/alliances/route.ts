import { NextResponse } from "next/server";
import { buildAlliancesDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildAlliancesDashboard();
  return NextResponse.json(payload);
}
