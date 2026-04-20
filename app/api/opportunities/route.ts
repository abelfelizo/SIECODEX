import { NextResponse } from "next/server";
import { buildOpportunitiesDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildOpportunitiesDashboard();
  return NextResponse.json(payload);
}
