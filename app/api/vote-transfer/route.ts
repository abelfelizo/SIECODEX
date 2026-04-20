import { NextResponse } from "next/server";
import { buildVoteTransferDashboard } from "@/lib/engines/intelligence";

export async function GET() {
  const payload = await buildVoteTransferDashboard();
  return NextResponse.json(payload);
}
