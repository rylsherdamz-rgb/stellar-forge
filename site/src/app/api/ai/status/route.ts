import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/ai";

// GET /api/ai/status -> { enabled }  (lets the UI hide AI buttons when unconfigured)
export async function GET() {
  return NextResponse.json({ enabled: aiEnabled() });
}
